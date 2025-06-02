from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from questions.models import Question, CausalLink
from .common import QuestionSerializer


class CausalLinkSerializer(serializers.ModelSerializer):
    """Serializer for reading CausalLink objects"""
    source_question = QuestionSerializer(read_only=True)
    target_question = QuestionSerializer(read_only=True)
    
    class Meta:
        model = CausalLink
        fields = [
            'id', 'source_question', 'target_question', 
            'direction', 'strength', 'reasoning', 'link_type',
            'status', 'resolution_status', 'forecast_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'link_type', 'created_at', 'updated_at']


class CausalLinkWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating CausalLink objects"""
    source_question_id = serializers.IntegerField(write_only=True)
    target_question_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = CausalLink
        fields = [
            'source_question_id', 'target_question_id',
            'direction', 'strength', 'reasoning'
        ]
    
    def validate_source_question_id(self, value):
        try:
            question = Question.objects.get(pk=value)
        except Question.DoesNotExist:
            raise serializers.ValidationError("Source question does not exist")
        
        # MVP constraint: source must be binary
        if question.type != Question.QuestionType.BINARY:
            raise serializers.ValidationError("Source question must be binary")
        
        return value
    
    def validate_target_question_id(self, value):
        try:
            question = Question.objects.get(pk=value)
        except Question.DoesNotExist:
            raise serializers.ValidationError("Target question does not exist")
        
        # MVP constraint: target must be binary, numeric, or date
        allowed_types = [
            Question.QuestionType.BINARY,
            Question.QuestionType.NUMERIC, 
            Question.QuestionType.DATE
        ]
        if question.type not in allowed_types:
            raise serializers.ValidationError(
                "Target question must be binary, numeric, or date"
            )
        
        return value
    
    def validate(self, data):
        source_id = data.get('source_question_id')
        target_id = data.get('target_question_id')
        
        # Prevent self-links
        if source_id == target_id:
            raise serializers.ValidationError(
                "Source and target questions cannot be the same"
            )
        
        # Check for existing link (duplicate prevention)
        user = self.context['request'].user
        if CausalLink.objects.filter(
            user=user,
            source_question_id=source_id,
            target_question_id=target_id
        ).exists():
            raise serializers.ValidationError(
                "A causal link between these questions already exists"
            )
        
        # Check for reverse causal link (A→B and B→A should not both exist)
        if CausalLink.objects.filter(
            user=user,
            source_question_id=target_id,
            target_question_id=source_id
        ).exists():
            raise serializers.ValidationError(
                "A reverse causal link already exists between these questions"
            )
        
        return data
    
    def create(self, validated_data):
        user = self.context['request'].user
        source_question = Question.objects.get(pk=validated_data['source_question_id'])
        target_question = Question.objects.get(pk=validated_data['target_question_id'])
        
        return CausalLink.objects.create(
            user=user,
            source_question=source_question,
            target_question=target_question,
            direction=validated_data['direction'],
            strength=validated_data['strength'],
            reasoning=validated_data.get('reasoning', '')
        )


class QuestionCausalLinksSerializer(serializers.Serializer):
    """Serializer for question's causal links (both incoming and outgoing)"""
    incoming_links = CausalLinkSerializer(many=True, read_only=True)
    outgoing_links = CausalLinkSerializer(many=True, read_only=True)
