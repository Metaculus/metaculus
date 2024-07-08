import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(() => import("@/components/markdown_editor"), {
  ssr: false,
});

const markdown = `
# Heading 1

## Heading 2

Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias deserunt dicta ea enim et ex, fugit ipsa iste laboriosam nobis nostrum repellendus sequi sit suscipit ut vel velit vero vitae.

***

> quote

- list items 1
- list item 2

[Link](https://google.com)

![image](https://fastly.picsum.photos/id/780/200/300.jpg?hmac=Zmxf0t2fpCbfZrR5NAXA_IKAP_8P6fYe9P440jUTWag "Title")
![image](https://fastly.picsum.photos/id/780/200/300.jpg?hmac=Zmxf0t2fpCbfZrR5NAXA_IKAP_8P6fYe9P440jUTWag "Title")

![image1](https://fastly.picsum.photos/id/10/2500/1667.jpg?hmac=J04WWC_ebchx3WwzbM-Z4_KC_LeLBWr5LZMaAkWkF68 "Title")

#### Table 1

| **Forecaster** | **Total score** | **Take**        | **%Prize** | **Prize** |
| -------------- | --------------- | --------------- | ---------- | --------- |
| **A**              | 40×30=1200      | 1200²=1,440,000 | 76.2%      | $762      |
| B              | 40×30×½=600     | 600²=360,000    | 19.0%      | $190      |
| C              | 10×30=300       | 300²=90,000     | 4.8%       | $48       |
| D              | -20×30=-600     | 0               | 0%         | $0        |
| E              | -50×30=-1500    | 0               | 0%         | $0        |
| sum            | 0               | 1,890,000       | 100%       | $1000     |

#### Table 2

| **Tournaments retaining the old scoring system**                                                     | **Tournaments using the new scoring system**                                                   |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [Alt-Protein Tournament](https://www.metaculus.com/tournament/alt-protein-tournament/)               | [Cultured Meat Tournament](https://www.metaculus.com/tournament/cultured-meat-tournament/)     |
| [Keep Virginia Safe Tournament](https://www.metaculus.com/tournament/vdh/)                           | [Climate Tipping Points](https://www.metaculus.com/tournament/climate/)                        |
| [Trade Signal Tournament](https://www.metaculus.com/tournament/trade-signal-tournament/)             | [🛰 The Sagan Space Tournament 🛰](https://www.metaculus.com/tournament/sagan-tournament/)     |
| [NuclearRisk Tournament](https://www.metaculus.com/tournament/nuclear-risk-forecasting-tournament/)  | [FRO-casting](https://www.metaculus.com/tournament/fro-casting/)                               |
| [Virginia Lightning Round Tournament](https://www.metaculus.com/tournament/valightning/)             | [Conditional Cup](https://www.metaculus.com/tournament/conditional-cup/)                       |
| [Real-Time Pandemic Decision Making](https://www.metaculus.com/tournament/realtimepandemic/)         | [Respiratory Outlook 2023/24](https://www.metaculus.com/tournament/respiratory-outlook-23-24/) |
| [Global Trends 2022](https://www.metaculus.com/tournament/economist2022/)                            | [Chinese AI Chips](https://www.metaculus.com/tournament/chinese-ai-chips/)                     |
| [FluSight Challenge 2021/22](https://www.metaculus.com/tournament/flusight-challenge/)               | [ACX 2024 Prediction Contest](https://www.metaculus.com/tournament/ACX2024/)                   |
| [China and Global Cooperation](https://www.metaculus.com/tournament/future-of-china/)                |                                                                                                |
| [Ukraine Conflict](https://www.metaculus.com/tournament/ukraine-conflict/)                           | Any new [tournament](https://www.metaculus.com/tournaments/) that opens in the future          |
| [White Hat Cyber](https://www.metaculus.com/tournament/white-hat/)                                   |                                                                                                |
| [Economist 2021](https://www.metaculus.com/tournament/1730/)                                         |                                                                                                |
| [Humanitarian Conflict & Economic Risk](https://www.metaculus.com/tournament/humanitarian/)          |                                                                                                |
| [FluSight Challenge 2022/23](https://www.metaculus.com/tournament/flusight-challenge22-23/)          |                                                                                                |
| [🔰Q4 2022 Beginner Tournament 🔰](https://www.metaculus.com/tournament/Q42022-beginner-tournament/) |                                                                                                |
| [ACX 2023 Prediction Contest](https://www.metaculus.com/tournament/2023-contest/)                    |                                                                                                |
| [🔰Q1 2023 Beginner Tournament 🔰](https://www.metaculus.com/tournament/Q12023-beginner-tournament/) |                                                                                                |
| [Keep Virginia Safe II](https://www.metaculus.com/tournament/keep-virginia-safe-ii/)                 |                                                                                                |
| [📰 Breaking News Tournament 📰](https://www.metaculus.com/tournament/breaking-news/)                |                                                                                                |
| [🔰Q2 2023 Beginner Tournament 🔰](https://www.metaculus.com/tournament/beginner-tournament/)        |                                                                                                |
| [🏆 Q3 2023 Quarterly Cup 🏆](https://www.metaculus.com/tournament/quarterly-cup-2023q3/)            |                                                                                                |
| [FluSight Challenge 2023/24](https://www.metaculus.com/tournament/flusight-challenge23-24/)          |                                                                                                |
| [🏆 Q4 2023 Quarterly Cup 🏆](https://www.metaculus.com/tournament/quarterly-cup-2023q4/)            |                                                                                                |
| [Global Pulse Tournament](https://www.metaculus.com/tournament/global-pulse/)                        |                                                                                                |
| [🏆 Quarterly Cup 🏆](https://www.metaculus.com/tournament/quarterly-cup/)                           |                                                                                                |

<EmbeddedQuestion id="1" />

<EmbeddedQuestion id="2" />

`;

export default function TestNewsEditor() {
  return (
    <main className="p-4">
      <h1>Read mode:</h1>
      <div className="h-50vh mx-auto max-w-3xl overflow-auto rounded-lg bg-gray-0 dark:bg-gray-100-dark">
        <MarkdownEditor markdown={markdown} mode="write" />
      </div>
      <hr />
      <h1>Write mode:</h1>
      <div className="h-50vh mx-auto max-w-6xl overflow-auto bg-gray-0 px-2 dark:bg-gray-100-dark">
        <MarkdownEditor markdown={markdown} mode="read" />
      </div>
    </main>
  );
}
