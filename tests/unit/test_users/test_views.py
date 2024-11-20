from unittest.mock import Mock
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APIClient
from tests.unit.fixtures import *  # noqa
from users.views import check_text_for_spam
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta


class TestUserProfileUpdate:
    url = reverse("user-update-profile")

    def test_update_bio_with_spam(
        self, user1_client: APIClient, mocker: Mock, user1: User
    ) -> None:
        # Mock the spam check to return True (indicating spam)
        mock_spam_check = mocker.patch(
            f"{check_text_for_spam.__module__}.{check_text_for_spam.__name__}"
        )
        mock_spam_check.return_value = True

        response = user1_client.patch(
            self.url, {"bio": "This is spam content"}, format="json"
        )

        days_since_joining = 6
        email = "user@metaculus.com"
        user1.date_joined = timezone.now() - timedelta(days=days_since_joining + 1)
        user1.email = email
        user1.save()

        assert isinstance(response, Response)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        mock_spam_check.assert_called_once_with(
            "This is spam content", email
        )
        assert response.data is not None, "There needs to be a response body"
        assert (
            "support@metaculus.com" in response.data["message"]
        ), "There needs to be a way to appeal in the message"
        assert (
            response.data["error_code"] == "SPAM_DETECTED"
        ), "There needs to be an error code"

    def test_update_bio_without_spam(
        self, user1_client: APIClient, mocker: Mock, user1: User
    ) -> None:
        # Mock the spam check to return False (no spam)
        mock_spam_check = mocker.patch(
            f"{check_text_for_spam.__module__}.{check_text_for_spam.__name__}"
        )
        mock_spam_check.return_value = False

        email = "user@metaculus.com"
        user1.email = email
        user1.save()

        response = user1_client.patch(
            self.url, {"bio": "This is legitimate content"}, format="json"
        )


        assert isinstance(response, Response)
        assert response.status_code == status.HTTP_200_OK
        mock_spam_check.assert_called_once_with(
            "This is legitimate content", email
        )

    def test_update_bio_empty_string(
        self, user1_client: APIClient, mocker: Mock
    ) -> None:
        mock_spam_check = mocker.patch(
            f"{check_text_for_spam.__module__}.{check_text_for_spam.__name__}"
        )
        response = user1_client.patch(self.url, {"bio": ""}, format="json")

        assert isinstance(response, Response)
        assert response.status_code == status.HTTP_200_OK
        mock_spam_check.assert_not_called()

    def test_update_profile_without_bio(
        self, user1_client: APIClient, mocker: Mock
    ) -> None:
        # Mock the spam check
        mock_spam_check = mocker.patch(
            f"{check_text_for_spam.__module__}.{check_text_for_spam.__name__}"
        )

        # Update various profile fields except bio
        response = user1_client.patch(
            self.url,
            {
                "website": "https://example.com",
                "twitter": "twitterhandle",
                "location": "New York",
                "occupation": "Developer",
            },
            format="json",
        )

        assert isinstance(response, Response)
        assert response.status_code == status.HTTP_200_OK
        mock_spam_check.assert_not_called()

    def test_update_bio_long_time_member(
        self, user1_client: APIClient, mocker: Mock, user1: User
    ) -> None:
        mock_spam_check = mocker.patch(
            f"{check_text_for_spam.__module__}.{check_text_for_spam.__name__}"
        )
        mock_spam_check.return_value = True  # Even if it's spam, it should be allowed

        days_since_joining = 8
        user1.date_joined = timezone.now() - timedelta(days=days_since_joining + 1)
        user1.save()

        response = user1_client.patch(
            self.url, {"bio": "This would normally be spam"}, format="json"
        )

        assert isinstance(response, Response)
        assert response.status_code == status.HTTP_200_OK
        mock_spam_check.assert_not_called()


@pytest.mark.skip(reason="Run this manually when needed. It should not be run automatically")
@pytest.mark.parametrize(
    "bio, username, is_spam",
    [
        ("This is legitimate content", "user1@gmail.com", False),
        ("I was born in 1990 and I love to play poker", "geniegeneral@gmail.com", False),
        ("I was born in 1990 have forecasted since I was 9, and love to play poker", "geniegeneral@gmail.com", False),
        ("Moderator. Contact at skppcj@gmail.com", "skppcj@gmail.com", False),
        (
            "Chief of Staff at Metaculus.  Excited about making forecasting more useful.",
            "ibij@outlook.com",
            False,
        ),
        (
            "My day job is as a software engineer at [JMA Wireless](https://www.jmawireless.com)",
            "geniegeneral@gmail.com",
            False,
        ),
        ("This is spam content", "user1@gmail.com", True),
        (
            """
[<u>TK88</u>](https://tk88i.bet/) - Khám phá ngay những điều bất ngờ tại - tk88i.bet Đến với chúng tôi, bạn sẽ trải nghiệm giải trí trực tuyến đỉnh cao với hàng loạt trò chơi thú vị, từ đó chinh phục những giải thưởng hấp dẫn đang chờ đón.

Website: [<u>https://tk88i.bet/</u>](https://tk88i.bet/) 

Thông tin liên hệ

Địa chỉ: 182 Đ. Nguyễn Xí, Phường 26, Bình Thạnh, Hồ Chí Minh, Việt Nam

Map: [<u>https://maps.app.goo.gl/Q1XsM5bAsR5dZ1Qu9</u>](https://maps.app.goo.gl/Q1XsM5bAsR5dZ1Qu9) 

Phone: 0986235238

\#tk88, #tk88\_casino, #nhacai\_tk88, #tk88\_bet, #tk88bet
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

Sao Cự Môn, khi nằm tại cung Quan Lộc, mang đến những ý nghĩa đặc biệt về sự nghiệp và thành công. Với đặc điểm nổi bật về trí tuệ và khả năng phản biện, người có sao Cự Môn ở cung Quan Lộc thường sở hữu tư duy sắc bén và khả năng phân tích tốt, nhưng cũng dễ gặp các thử thách và xung đột trong sự nghiệp. Cùng Tracuulasotuvi.com tìm hiểu về sao Cự Môn tọa  ở cung Quan Lộc và khám phá cách phát huy tối đa tiềm năng để đạt được sự nghiệp ổn định và thành công.

## Đặc điểm của người có sao Cự Môn ở cung Quan Lộc

* Trí tuệ sắc bén và tư duy phản biện mạnh mẽ: Người có sao Cự Môn ở cung Quan Lộc thường có trí tuệ vượt trội, với khả năng phân tích sâu sắc và luôn có những ý kiến riêng biệt về vấn đề trong công việc. Họ không ngại đưa ra quan điểm và sẵn sàng tranh luận để bảo vệ ý kiến của mình. Điều này giúp họ trở nên nổi bật trong những ngành nghề cần sự chi tiết và lý luận logic.
* Khả năng tìm kiếm và khám phá: Người có Cự Môn trong cung Quan Lộc thích tìm hiểu và không ngừng học hỏi. Họ là người ham hiểu biết và luôn nỗ lực để khám phá những khía cạnh mới trong công việc. Tinh thần học hỏi này giúp họ tích lũy nhiều kiến thức và kỹ năng, hỗ trợ cho sự phát triển sự nghiệp.
* Cẩn trọng và tính cách nghiêm túc trong công việc: Sao Cự Môn mang lại cho người sở hữu tính cách cẩn trọng và kỹ lưỡng. Trong công việc, họ có thể dành nhiều thời gian để phân tích các yếu tố trước khi đưa ra quyết định. Tuy nhiên, điều này đôi khi khiến họ thiếu đi sự linh hoạt hoặc chậm trong việc nắm bắt cơ hội kịp thời.
* Dễ xảy ra mâu thuẫn trong môi trường làm việc: Sao Cự Môn có tính chất phản biện, nên người có sao này ở cung Quan Lộc dễ gặp mâu thuẫn hoặc xung đột trong các mối quan hệ đồng nghiệp nếu không biết cách kiểm soát cảm xúc. Họ có thể bị cho là quá chi tiết hoặc phê phán, dẫn đến hiểu lầm và ảnh hưởng đến sự hòa hợp trong công việc nhóm.

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
            "geeks@1956seo@agrautowheels.com",
            True,
        ),
    ],
)
def test_spam_detection(bio: str, username: str, is_spam: bool) -> None:
    identified_as_spam = check_text_for_spam(bio, username)
    assert (
        identified_as_spam == is_spam
    ), f"Bio: {bio}\nIdentified as spam: {identified_as_spam}, expected: {is_spam}"
