from datetime import timedelta
import logging
import pytest
import asyncio

from unittest.mock import Mock
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APIClient
from rest_framework.response import Response
from django.utils import timezone
from users.models import User
from users.services.spam_detection import ask_gpt_to_check_profile_for_spam

logger = logging.getLogger(__name__)


class TestUserProfileUpdate:
    url = reverse("user-update-profile")
    user_email = "user@metaculus.com"
    spam_free_pass_threshold = 7

    def test_update_bio_with_spam(
        self, user1_client: APIClient, mocker: Mock, user1: User
    ) -> None:
        mock_gpt_spam_check, mock_send_mail = mock_spam_detection_and_email(
            mocker, True
        )

        days_since_joining = self.spam_free_pass_threshold - 1
        self.set_up_user(user1, days_since_joining)
        original_bio = user1.bio
        new_bio = "This is spam content"

        response = user1_client.patch(self.url, {"bio": new_bio}, format="json")

        assert isinstance(response, Response)
        user1.refresh_from_db()
        mock_gpt_spam_check.assert_called_once()

        self.assert_response_is_403_with_proper_error_code(response)
        self.assert_user_is_deactivated_and_unchanged(user1, original_bio, new_bio)
        self.assert_notification_email_sent(mock_send_mail, self.user_email)

    def test_update_bio_without_spam(
        self, user1_client: APIClient, mocker: Mock, user1: User
    ) -> None:
        mock_gpt_spam_check, mock_send_mail = mock_spam_detection_and_email(
            mocker, False
        )

        self.set_up_user(user1, 1)

        self.assert_successful_response(
            {"bio": "This is legitimate content"},
            user1_client,
            user1,
            mock_gpt_spam_check,
            mock_send_mail,
            gpt_spam_call_should_be_made=True,
        )

    def test_update_bio_empty_string(
        self, user1_client: APIClient, mocker: Mock, user1: User
    ) -> None:
        mock_gpt_spam_check, mock_send_mail = mock_spam_detection_and_email(
            mocker, False
        )

        self.set_up_user(user1, 1)
        self.assert_successful_response(
            {"bio": ""},
            user1_client,
            user1,
            mock_gpt_spam_check,
            mock_send_mail,
            gpt_spam_call_should_be_made=False,
        )

    def test_update_profile_without_bio_but_with_website(
        self, user1_client: APIClient, mocker: Mock, user1: User
    ) -> None:
        mock_gpt_spam_check, mock_send_mail = mock_spam_detection_and_email(
            mocker, False
        )

        self.set_up_user(user1, 1)

        self.assert_successful_response(
            {
                "website": "https://example.com",
                "twitter": "twitterhandle",
                "location": "New York",
                "occupation": "Developer",
            },
            user1_client,
            user1,
            mock_gpt_spam_check,
            mock_send_mail,
            gpt_spam_call_should_be_made=True,
        )

    def test_update_profile_with_no_bio_or_website(
        self, user1_client: APIClient, mocker: Mock, user1: User
    ) -> None:
        mock_gpt_spam_check, mock_send_mail = mock_spam_detection_and_email(
            mocker, False
        )

        self.set_up_user(user1, 1)

        self.assert_successful_response(
            {
                "twitter": "twitterhandle",
                "location": "New York",
                "occupation": "Developer",
            },
            user1_client,
            user1,
            mock_gpt_spam_check,
            mock_send_mail,
            gpt_spam_call_should_be_made=False,
        )

    def test_update_bio_long_time_member(
        self, user1_client: APIClient, mocker: Mock, user1: User
    ) -> None:
        mock_gpt_spam_check, mock_send_mail = mock_spam_detection_and_email(
            mocker, True
        )

        days_since_joining = self.spam_free_pass_threshold + 1
        self.set_up_user(user1, days_since_joining)

        self.assert_successful_response(
            {
                "bio": "This would normally be spam, but the account has been around for a while"
            },
            user1_client,
            user1,
            mock_gpt_spam_check,
            mock_send_mail,
            gpt_spam_call_should_be_made=False,
        )

    def test_update_bio_and_website(
        self, user1_client: APIClient, mocker: Mock, user1: User
    ) -> None:
        mock_gpt_spam_check, mock_send_mail = mock_spam_detection_and_email(
            mocker, False
        )

        self.set_up_user(user1, 1)

        self.assert_successful_response(
            {
                "bio": "This is legitimate content",
                "website": "https://example.com",
                "twitter": "https://twitter.com/example",
                "location": "New York",
                "occupation": "Developer",
            },
            user1_client,
            user1,
            mock_gpt_spam_check,
            mock_send_mail,
            gpt_spam_call_should_be_made=True,
        )

    def set_up_user(self, user: User, days_since_joining: int) -> None:
        assert user.is_active, "The user should be active at first"
        user.date_joined = timezone.now() - timedelta(days=days_since_joining)
        user.email = self.user_email
        user.save()

    def assert_successful_response(
        self,
        patch_data: dict,
        user_client: APIClient,
        user: User,
        mock_gpt_spam_check: Mock,
        mock_send_mail: Mock,
        gpt_spam_call_should_be_made: bool,
    ) -> None:
        old_bio = user.bio
        assert user.is_active, "The user should be active at first"
        response = user_client.patch(self.url, patch_data, format="json")

        user.refresh_from_db()
        assert user.bio == (
            patch_data["bio"] if "bio" in patch_data else old_bio
        ), "The bio should be updated"
        assert isinstance(response, Response)
        assert response.status_code == status.HTTP_200_OK
        assert user.is_active, "The user should not be soft deleted"
        if gpt_spam_call_should_be_made:
            mock_gpt_spam_check.assert_called_once()
        else:
            mock_gpt_spam_check.assert_not_called()
        mock_send_mail.assert_not_called()

    def assert_response_is_403_with_proper_error_code(self, response: Response) -> None:
        assert isinstance(response, Response)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data is not None, "There needs to be a response body"
        assert (
            response.data["error_code"] == "SPAM_DETECTED"
        ), "There needs to be an error code"

    def assert_user_is_deactivated_and_unchanged(
        self, user: User, original_bio: str, new_bio: str
    ) -> None:
        assert not user.is_active, "The user should be soft deleted"
        assert user.bio != new_bio, "The bio should not be updated"
        assert user.bio == original_bio, "The bio should not be changed"

    def assert_notification_email_sent(
        self, mock_send_mail: Mock, recipient_email: str
    ) -> None:
        mock_send_mail.assert_called_once()
        call_kwargs = mock_send_mail.call_args[1]  # Get kwargs from the call
        assert call_kwargs["recipient_list"] == [
            recipient_email
        ], "Email should be sent to the user"
        assert (
            "support@metaculus.com" in call_kwargs["message"]
        ), "Message should mention support email"


def mock_spam_detection_and_email(
    mocker: Mock, gpt_spam_check_returns_positive: bool
) -> tuple[Mock, Mock]:
    mock_gpt_spam_check = mocker.patch(
        f"{ask_gpt_to_check_profile_for_spam.__module__}.{ask_gpt_to_check_profile_for_spam.__name__}"
    )
    mock_gpt_spam_check.return_value = (
        gpt_spam_check_returns_positive,
        "Mocked reasoning",
    )
    mock_send_mail = mocker.patch("misc.tasks.send_email_async.send")
    return mock_gpt_spam_check, mock_send_mail


@pytest.mark.skip(
    reason="Run this manually when needed. It should not be run automatically. It can be referenced as examples of real spam and legitimate content."
)
@pytest.mark.parametrize(
    "bio, username, is_spam",
    [
        ("This is legitimate content", "user1@gmail.com", False),
        (
            "I was born in 1990 and I love to play poker",
            "geniegeneral@gmail.com",
            False,
        ),
        (
            "I was born in 1990 have forecasted since I was 9, and love to play poker",
            "geniegeneral@gmail.com",
            False,
        ),
        (
            "My day job is as a software engineer at [JMA Wireless](https://www.jmawireless.com)",
            "geniegeneral@gmail.com",
            False,
        ),
        # Below are all real examples from the site (with non-spam emails made up)
        ("Moderator. Contact at skppcj@gmail.com", "skppcj@gmail.com", False),
        (
            "Chief of Staff at Metaculus.  Excited about making forecasting more useful.",
            "abaa@outlook.com",
            False,
        ),
        ("eigenrobot", "johnash@gmail.com", False),
        ("politics is alright", "ger6897@gmail.com", False),
        (
            "PhD Candidate @ MIT\nhttps://www.linkedin.com/in/peter-williams-5b8a0b119/",
            "peter.williams234@gmail.com",
            False,
        ),
        (
            """
A fox ever on the hunt for knowledge, and the best hunters catch enough to share.
If you have something interesting to say to me, do it here: https://vulpine.club/web/accounts/714027
Website: https://www.lorx.us/favor
""",
            "lupx@gmail.com",
            False,
        ),
        (
            """
[<u>TK88</u>](https://tk88i.bet/) - Khám phá ngay những điều bất ngờ tại - tk88i.bet Đến với chúng tôi, bạn sẽ trải nghiệm giải trí trực tuyến đỉnh cao với hàng loạt trò chơi thú vị, từ đó chinh phục những giải thưởng hấp dẫn đang chờ đón.

Website: [<u>https://tk88i.bet/</u>](https://tk88i.bet/) 

Thông tin liên hệ

Địa chỉ: 182 Đ. Nguyễn Xí, Phường 26, Bình Thạnh, Hồ Chí Minh, Việt Nam

Map: [<u>https://maps.app.goo.gl/Q1XsM5bAsR5dZ1Qu9</u>](https://maps.app.goo.gl/Q1XsM5bAsR5dZ1Qu9) 

Phone: 0986235238

#tk88, #tk88_casino, #nhacai_tk88, #tk88_bet, #tk88bet
""",
            "tk88ibet@gmail.com",
            True,
        ),
        (
            """
![](https://metaculus-web-media.s3.amazonaws.com/user_uploaded/400_ET4nCZy.png)

Founded in 2015, Iron Software is a leading technology company based in the United States, serving customers worldwide.

In the past, we believed that paying for software meant surrendering. We would spend hours scouring Git for open-source code, struggle through bugs and outdated platform support, and wrestle with minimal documentation just to get started on a project. We tried existing C# open-source components, but they left us frustrated.



So we decided to create our own.

Rather than wasting hours just trying to get started, we offer licensed products that allow you to pay once and focus on the real work of developing your project. We understand that as an engineer, this is just one step in your build, and it needs to work flawlessly.



By licensing our products, we provide:



Rigorous testing that ensures your system remains intact.

Monthly product updates and continuous improvement.

Support directly from our engineering team.

Feature requests, bug fixes, and direct customer engagement.

Step-by-step tutorials, videos, and clear, user-friendly documentation.

We believe in offering both best practices and affordable libraries. We take pride in our customers who appreciate the value we provide.

[c# convert html to pdf](https://dev.to/mhamzap10/c-pdf-generator-tutorial-html-to-pdf-merge-watermark-extract-h3i)
""",
            "jweqwrmmhag@outlook.com",
            True,
        ),
        (
            """
# Sao Cự Môn ở cung Quan Lộc: Ý nghĩa và ảnh hưởng đến sự nghiệp

Sao Cự Môn, khi nằm tại cung Quan Lộc, mang đến những ý nghĩa đặc biệt về sự nghiệp và thành công. Với đặc điểm nổi bật về trí tuệ và khả năng phản biện, người có sao Cự Môn ở cung Quan Lộc thường sở hữu tư duy sắc bén và khả năng phân tích tốt, nhưng cũng dễ gặp các thử thách và xung đột trong sự nghiệp. Cùng Tracuulasotuvi.com tìm hiu về sao Cự Môn tọa  ở cung Quan Lộc và khám phá cách phát huy tối đa tiềm năng để đạt đưc sự nghiệp ổn định và thành công.

## Đặc điểm của người có sao Cự Môn ở cung Quan Lộc

* Trí tuệ sắc bén và tư duy phản biện mạnh mẽ: Người có sao Cự Môn ở cung Quan Lộc thường có trí tuệ vượt trội, với khả năng phân tích sâu sắc và luôn có những ý kiến riêng biệt về vấn đề trong công việc. Họ không ngại đưa ra quan điểm và sẵn sàng tranh luận để bảo vệ ý kiến của mình. Điều này giúp họ trở nên nổi bật trong những ngành nghề cần sự chi tiết và lý luận logic.
* Khả năng tìm kiếm và khám phá: Người có Cự Môn trong cung Quan Lộc thích tìm hiểu và không ngừng học hỏi. Họ là người ham hiểu biết và luôn nỗ lực để khám phá những khía cạnh mới trong công việc. Tinh thần học hỏi này giúp họ tích lũy nhiều kiến thức và kỹ năng, hỗ trợ cho sự phát triển sự nghiệp.
* Cẩn trọng và tính cách nghiêm túc trong công việc: Sao Cự Môn mang lại cho người sở hữu tính cách cẩn trọng và kỹ lưỡng. Trong công việc, họ có thể dành nhiều thời gian để phân tích các yếu tố trước khi đưa ra quyết định. Tuy nhiên, điều này đôi khi khiến họ thiếu đi sự linh hoạt hoặc chậm trong việc nắm bắt cơ hội kịp thời.
* Dễ xảy ra mâu thuẫn trong môi trường làm việc: Sao Cự Môn có tính chất phản biện, nên người có sao ny ở cung Quan Lộc dễ gặp mâu thuẫn hoặc xung đột trong các mối quan hệ đồng nghiệp nếu không biết cách kiểm soát cảm xúc. Họ có thể bị cho là quá chi tiết hoặc phê phán, dẫn đến hiểu lầm và ảnh hưởng đến sự hòa hợp trong công việc nhóm.

⏩⏩⏩Nếu bạn đang tìm hiểu về ý nghĩa của [**cung tử tức có cự môn​**](https://padlet.com/tracuulasotuviofficial/cung-t-t-c-c-m-n-ngh-a-v-nh-h-ng-t-i-con-c-i-gia-o-69dc4jkccd6pgrcw) trong lá số tử vi, đừng bỏ qua bài viết chi tiết và thú vị này từ Tracuulasotuvi nhé!

<img height="0" width="0" alt="Sao Cự Môn tại cung Điền chủ về dễ gặp tranh chấp về đất đai" src="https://tracuulasotuvi.com/wp-content/uploads/2024/03/Sao-Cu-Mon-tai-cung-Dien-chu-ve-de-gap-tranh-chap-ve-dat-dai.jpg" />

## Ảnh hưởng của sao Cự Môn ở cung Quan Lộc đến sự nghiệp

* Sự phát triển trong các lĩnh vực trí tuệ: Với trí tuệ sắc bén và khả năng phân tích vượt trội, người có sao Cự Môn ở cung Quan Lộc thường phát triển tốt trong các lĩnh vực yêu cầu tư duy logic như tài chính, kế toán, nghiên cứu, giảng dạy hoặc các ngành nghề liên quan đến phân tích dữ liệu.  
* Khó khăn trong hợp tác và làm việc nhóm: Cự Môn ở cung Quan Lộc dễ gây ra mâu thuẫn khi làm việc với người khác, đặc biệt nếu người sở hữu sao này có xu hướng quá kỹ lưỡng hoặc thích phản biện. Để duy trì mối quan hệ tốt trong môi trường làm việc, họ cần học cách lắng nghe ý kiến của người khác và giảm bớt cái tôi khi làm việc nhóm.
* Khả năng đối diện và vượt qua thách thức: Sao Cự Môn ở cung Quan Lộc giúp người sở hữu có sự kiên nhẫn và khả năng chịu đựng tốt trong các tình huống căng thẳng. Họ không dễ dàng từ bỏ và thường có tinh thần kiên cường để vượt qua những thử thách trong công việc. 
* Lo lắng và căng thẳng về tương lai sự nghiệp: Với Cự Môn tọa ở cung Quan Lộc, người sở hữu có thể dễ dàng rơi vào trạng thái lo âu, đặc biệt là khi phải đối diện với các quyết định quan trọng hoặc những thay đổi lớn trong công việc. Sự lo lắng này có thể làm ảnh hưởng đến sức khỏe tinh thần và hiệu suất làm việc, đòi hỏi họ phải học cách cân bằng và giải tỏa căng thẳng.

⏩⏩⏩Bạn thắc mắc [**sao chủ mệnh cự môn sao chủ thân thiên tướng**](https://glose.com/activity/672d89163986c673a259feee) trong lá số tử vi nói lên điều gì? Hãy để Tracuulasotuvi giải đáp chi tiết cho bạn!

<img height="0" width="0" alt="Sao Cự Môn tại cung Quan lộc chủ về tay trắng làm nên sự nghiệp" src="https://tracuulasotuvi.com/wp-content/uploads/2024/03/Sao-Cu-Mon-tai-cung-Quan-loc-chu-ve-tay-trang-lam-nen-su-nghiep.jpg" />

## Cách hóa giải và phát huy tiềm năng của sao Cự Môn ở cung Quan Lộc

* Tăng cường kỹ năng giao tiếp và lắng nghe: Người có sao Cự Môn ở cung Quan Lộc cần cải thiện kỹ năng giao tiếp để giảm thiểu những mâu thuẫn không đáng có. Việc lắng nghe ý kiến của người khác và thể hiện sự tôn trọng sẽ giúp họ xây dựng được mối quan hệ tốt với đồng nghiệp, từ đó thúc đẩy sự phát triển trong công việc.
* Phát huy khả năng phân tích trong các lĩnh vực phù hợp: Với khả năng tư duy logic và phân tích, người có Cự Môn ở cung Quan Lộc nên chọn các công việc phù hợp với kỹ năng này, chẳng hạn như các ngành liên quan đến nghiên cứu, kế toán, quản lý dự án, hoặc công nghệ thông tin. 
* Thực hành tư duy tích cực để giảm bớt căng thẳng: Người có sao Cự Môn thường lo lắng về công việc và tương lai. Để duy trì sự ổn định tinh thần, họ nên tập trung vào tư duy tích cực, không để những căng thẳng nhỏ ảnh hưởng đến tâm lý. Thực hành các bài tập như thiền định, yoga, hoặc các hoạt động giải trí giúp giảm thiểu áp lực.
* Tìm kiếm sự cân bằng giữa lý trí và linh hoạt: Người có sao Cự Môn ở cung Quan Lộc thường có xu hướng quá phân tích và thiếu linh hoạt trong các quyết định. Để phát huy tiềm năng trong sự nghiệp, họ nên học cách linh hoạt hơn, chấp nhận rủi ro khi cần và không quá khắt khe với bản thân trong việc đạt được kết quả hoàn hảo.
* Phát triển kỹ năng quản lý thời gian: Với tính cách cẩn trọng và chi tiết, người có Cự Môn ở cung Quan Lộc dễ bị cuốn vào các công việc nhỏ nhặt. Kỹ năng quản lý thời gian sẽ giúp họ tập trung vào các công việc quan trọng, tránh mất thời gian cho những việc không cần thiết và tối ưu hóa năng suất làm việc.

⏩⏩⏩Nếu bạn quan tâm đến [**cự môn hãm địa cung mệnh**](https://tinhte.vn/thread/kham-pha-cu-mon-ham-dia.3881478/) trong tử vi, đừng chần chừ, hãy ghé thăm Tracuulasotuvi ngay hôm nay!

## Kết luận

Sao Cự Môn ở cung Quan Lộc mang đến những ảnh hưởng quan trọng đến sự nghiệp và định hướng công danh. Với trí tuệ sắc bén và khả năng phân tích, người sở hữu mệnh này có tiềm năng đạt được thành công trong các lĩnh vực yêu cầu tư duy logic. Tuy nhiên, họ cũng cần vượt qua những thách thức về mặt giao tiếp và cân bằng cảm xúc để duy trì sự hài hòa trong công việc.

Tìm hiểu sâu về sao Cự Môn ở cung Quan Lộc và ảnh hưởng đến sự nghiệp của bạn tại Tracuulasotuvi.com. Đội ngũ chuyên gia sẽ giúp bạn khám phá vận mệnh và đưa ra những lời khuyên hữu ích để phát huy tối đa tiềm năng trong cuộc sống và công việc.
""",
            "leomaii@outlook.com.vn",
            True,
        ),
        (
            """
We are offering #1 IT support services in Los Angeles - Beverly Hills - Burbank - West Hollywood - Glendale - IT consulting - Managed IT services.![](https://metaculus-web-media.s3.amazonaws.com/user_uploaded/geeks500x500.jpg)
""",
            "1956seo@agrautowheels.com",
            True,
        ),
    ],
)
def test_spam_detection(bio: str, username: str, is_spam: bool) -> None:
    identified_as_spam, gpt_response = asyncio.run(
        ask_gpt_to_check_profile_for_spam(bio, username)
    )
    try:
        assert (
            identified_as_spam == is_spam
        ), f"Bio: {bio}\nIdentified as spam: {identified_as_spam}, expected: {is_spam}\nGPT response: {gpt_response}"
    finally:
        logger.debug(
            f"Bio: {bio}\nIdentified as spam: {identified_as_spam}, expected: {is_spam}\nGPT response: {gpt_response}"
        )
