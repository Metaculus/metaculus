from django.core.management.base import BaseCommand
from django.db import connection

from migrator.services.migrate_questions import migrate_questions__notebook

from ...services.migrate_permissions import migrate_permissions
from ...utils import paginated_query, reset_sequence


class Command(BaseCommand):
    help = """
    A small debug command to play around with your current migration script stage
    """

    def handle(self, *args, **options):
        old_groups = {}
        for old_question in paginated_query(
            """SELECT 
                            q.*, 
                            qc.parent_id as condition_id, 
                            qc.unconditional_question_id as condition_child_id, 
                            qc.resolution as qc_resolution FROM (
                                    SELECT
                                        q.*,
                                        ARRAY_AGG(o.label) AS option_labels
                                    FROM
                                        metac_question_question q
                                    LEFT JOIN
                                        metac_question_option o ON q.id = o.question_id
                                    WHERE  type in ('conditional_group', 'group', 'notebook', 'discussion', 'claim') or group_id is not null
                                    
                                    GROUP BY q.id
                                ) q
                        LEFT JOIN 
                            metac_question_conditional qc ON qc.child_id = q.id
                        -- Ensure parents go first
                        ORDER BY group_id DESC;
                                                                """,
            itersize=10000,
        ):
            group_id = old_question["group_id"]

            # If root
            if not group_id:
                old_groups[old_question["id"]] = {**old_question, "children": []}
            else:
                old_groups[group_id]["children"].append(old_question)

        print("Migrating notebooks")
        migrate_questions__notebook(list(old_groups.values()))

        # Reset sql sequences
        reset_sequence()
