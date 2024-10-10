import { format } from "date-fns";
import { range, set } from "lodash";
import { useEffect, useState } from "react";
import { QuestionWithNumericForecasts } from "@/types/question";

import Checkbox from "@/components/ui/checkbox";
import { Input } from "@/components/ui/form_field";
import { QuestionType } from "@/types/question";
import ContinuousPredictionChart from "../[id]/components/forecast_maker/continuous_prediction_chart";

const NumericQuestionInput: React.FC<{
  onChange: (
    min: number,
    max: number,
    open_upper_bound: boolean,
    open_lower_bound: boolean,
    zero_point: number | null
  ) => void;
  questionType: QuestionType.Numeric | QuestionType.Date;
  defaultMin: number | undefined;
  defaultMax: number | undefined;
  defaultOpenUpperBound: boolean | undefined | null;
  defaultOpenLowerBound: boolean | undefined | null;
  defaultZeroPoint: number | undefined | null;
  isLive: boolean;
  canSeeLogarithmic: boolean | undefined;
}> = ({
  onChange,
  questionType,
  defaultMin,
  defaultMax,
  defaultOpenUpperBound,
  defaultOpenLowerBound,
  defaultZeroPoint,
  isLive,
  canSeeLogarithmic,
}) => {
  const [errors, setError] = useState<string[]>([]);
  const [max, setMax] = useState(defaultMax);
  const [min, setMin] = useState(defaultMin);
  const [openUpperBound, setOpenUpperBound] = useState(
    defaultOpenUpperBound === undefined || defaultOpenUpperBound === null
      ? false
      : defaultOpenUpperBound
  );
  const [openLowerBound, setOpenLowerBound] = useState(
    defaultOpenLowerBound === undefined || defaultOpenLowerBound === null
      ? false
      : defaultOpenLowerBound
  );
  const [zeroPoint, setZeroPoint] = useState(
    defaultZeroPoint === undefined ||
      defaultZeroPoint === null ||
      Number.isNaN(defaultZeroPoint)
      ? null
      : defaultZeroPoint
  );
  const [question, setQuestion] = useState<QuestionWithNumericForecasts>({
    id: 1,
    title: "",
    description: "",
    created_at: "",
    updated_at: "",
    scheduled_close_time: "",
    scheduled_resolve_time: "",
    possibilities: {},
    fine_print: "",
    resolution_criteria: "",
    label: "",
    nr_forecasters: 0,
    author_username: "",
    post_id: 0,
    resolution: "",
    forecasts: {
      timestamps: [],
      nr_forecasters: [],
      my_forecasts: {
        timestamps: [],
        medians: [],
        slider_values: null,
      },
      medians: [],
      q3s: [],
      q1s: [],
      means: [],
      latest_pmf: [],
      latest_cdf: [],
      histogram: [],
    },
    type: questionType,
    scaling: {
      range_max: max!,
      range_min: min!,
      zero_point: zeroPoint,
    },
    open_lower_bound: openLowerBound,
    open_upper_bound: openUpperBound,
    aggregations: {
      recency_weighted: { history: [], latest: undefined },
    },
  });

  const runChecks = () => {
    const current_errors = [];
    if (max === undefined) {
      current_errors.push("Max is required");
    }
    if (min === undefined) {
      current_errors.push("Min is required");
    }

    if (zeroPoint !== undefined && zeroPoint !== null) {
      if ((min ? min : 0) <= zeroPoint && zeroPoint <= (max ? max : 0)) {
        questionType == QuestionType.Numeric
          ? current_errors.push(
              `Zero point (${zeroPoint}) should not be between min (${min}) and max (${max})`
            )
          : current_errors.push(
              `Zero point (${format(new Date(zeroPoint * 1000), "yyyy-MM-dd HH:mm")}) should not be between min (${format(new Date((min ? min : 0) * 1000), "yyyy-MM-dd HH:mm")}) and max (${format(new Date((max ? max : 0) * 1000), "yyyy-MM-dd HH:mm")})`
            );
      }
    }
    if (min !== undefined && max !== undefined) {
      if (min >= max) {
        current_errors.push("Minimum value should be less than maximum value");
      }
    }

    setError(current_errors);
    if (current_errors.length > 0) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    const ok = runChecks();
    if (!ok) {
      return;
    }
    onChange(
      min as number,
      max as number,
      openUpperBound,
      openLowerBound,
      zeroPoint
    );
    setQuestion((prevQuestion) => ({
      ...prevQuestion,
      open_upper_bound: openUpperBound,
      open_lower_bound: openLowerBound,
      scaling: {
        range_max: max!,
        range_min: min!,
        zero_point: zeroPoint,
      },
    }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, openUpperBound, openLowerBound, zeroPoint]);

  return (
    <div>
      {errors.length > 0 && (
        <div className="mb-4 mt-2 flex flex-col gap-2 rounded-md bg-red-400 px-2 py-1 text-white">
          {errors.map((error, index) => {
            return <div key={index}>{error}</div>;
          })}
        </div>
      )}
      <div className="flex flex-col gap-4">
        {questionType == QuestionType.Numeric && (
          <>
            <div>
              <span className="mr-2">Min</span>
              <Input
                readOnly={isLive}
                type="float"
                defaultValue={min}
                onChange={(e) => {
                  e.preventDefault();
                  setMin(Number(e.target.value));
                }}
              />
            </div>
            <div>
              <span className="mr-2">Max</span>
              <Input
                readOnly={isLive}
                type="float"
                onChange={(e) => {
                  e.preventDefault();
                  setMax(Number(e.target.value));
                }}
                defaultValue={max}
              />
            </div>
          </>
        )}
        {questionType == QuestionType.Date && (
          <>
            <div className="flex w-full flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <span className="mr-2">Min</span>
                <Input
                  readOnly={isLive}
                  type="datetime-local"
                  className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                  defaultValue={
                    min !== undefined && !Number.isNaN(min)
                      ? format(new Date(min * 1000), "yyyy-MM-dd'T'HH:mm")
                      : undefined
                  }
                  onChange={(e) => {
                    setMin(new Date(e.target.value).getTime() / 1000);
                  }}
                />
              </div>
              <div className="flex w-full flex-col gap-2">
                <span className="mr-2">Max</span>
                <Input
                  readOnly={isLive}
                  type="datetime-local"
                  className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                  defaultValue={
                    max !== undefined && !Number.isNaN(max)
                      ? format(new Date(max * 1000), "yyyy-MM-dd'T'HH:mm")
                      : undefined
                  }
                  onChange={(e) => {
                    setMax(new Date(e.target.value).getTime() / 1000);
                  }}
                />
              </div>
            </div>
          </>
        )}
        {
          <>
            <div className="flex w-full flex-col gap-4 md:mt-[-8px] md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <Checkbox
                  label={"Open Upper Bound"}
                  readOnly={isLive}
                  onChange={async (e) => {
                    setOpenUpperBound(e);
                  }}
                  defaultChecked={openUpperBound}
                />
              </div>
              <div className="flex w-full flex-col gap-2">
                <Checkbox
                  label={"Open Lower Bound"}
                  readOnly={isLive}
                  onChange={(e) => {
                    setOpenLowerBound(e);
                  }}
                  defaultChecked={openLowerBound}
                />
              </div>
            </div>
          </>
        }
        {canSeeLogarithmic && (
          <div>
            <span className="mr-2">Logarithmic scaling?</span>
            <Input
              disabled={isLive}
              type="checkbox"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.checked) {
                  if (questionType == QuestionType.Numeric) {
                    setZeroPoint(0);
                  } else {
                    setZeroPoint(
                      (Date.now() - 1000 * 60 * 60 * 24 * 365) / 1000
                    );
                  }
                } else {
                  setZeroPoint(null);
                }
              }}
              checked={zeroPoint !== null && zeroPoint !== undefined}
            />
            {zeroPoint !== null &&
              zeroPoint !== undefined &&
              (questionType == QuestionType.Numeric ? (
                <div className="ml-2">
                  <span className="mr-2">Zero Point</span>
                  <Input
                    readOnly={isLive}
                    type="float"
                    onChange={(e) => {
                      setZeroPoint(Number(e.target.value));
                    }}
                    defaultValue={zeroPoint}
                  />
                </div>
              ) : (
                <div className="ml-2">
                  <span className="mr-2">Zero Point</span>
                  <Input
                    readOnly={isLive}
                    type="datetime-local"
                    onChange={(e) => {
                      setZeroPoint(new Date(e.target.value).getTime() / 1000);
                    }}
                    defaultValue={format(
                      new Date(!Number.isNaN(zeroPoint) ? zeroPoint * 1000 : 0),
                      "yyyy-MM-dd'T'HH:mm"
                    )}
                  />
                </div>
              ))}
          </div>
        )}
        {errors.length === 0 && (
          <>
            Example input chart:
            <ContinuousPredictionChart
              key={`${min}-${max}-${zeroPoint}`}
              dataset={{
                cdf: [
                  0, 0.0003559860144382004, 0.0007273747181487132,
                  0.001114930532478574, 0.001519454683336744,
                  0.0019417868553228746, 0.002382806907768082,
                  0.0028434366536355727, 0.003324641702067674,
                  0.0038274333651779737, 0.004352870629469466,
                  0.004902062192009721, 0.005476168561207467,
                  0.006076404221709888, 0.00670403986257084,
                  0.007360404667424569, 0.00804688866493204,
                  0.00876494513724409, 0.009516093083641356,
                  0.010301919735862197, 0.011124083120908707,
                  0.01198431466632526, 0.012884421842065157,
                  0.013826290832095337, 0.014811889227829753,
                  0.01584326873432389, 0.01692256787889919, 0.0180520147104921,
                  0.019233929476532477, 0.020470727262544303,
                  0.021764920577924386, 0.023119121869488023,
                  0.024536045942370247, 0.026018512265736794,
                  0.02756944713848893, 0.029191885687741594,
                  0.030888973670317975, 0.032663969044841944,
                  0.03452024327922807, 0.036461282355482176,
                  0.03849068743074384, 0.04061217511044839,
                  0.042829577286380975, 0.045146840489268814,
                  0.04756802470244256, 0.05009730158003831,
                  0.052738952010249016, 0.05549736296133118,
                  0.05837702354548507, 0.06138252023343126, 0.06451853115058,
                  0.06778981938422363, 0.07120122523027195, 0.0747576573078079,
                  0.07846408247027478, 0.0823255144435463, 0.08634700112360397,
                  0.09053361047018832, 0.09489041493774003, 0.09942247439134633,
                  0.10413481746338767, 0.10903242131628374, 0.11412018978827304,
                  0.11940292991264506, 0.12488532681636429, 0.1305719170216319,
                  0.1364670601936656, 0.14257490939981574, 0.1488993799690277,
                  0.1554441170664841, 0.16221246212584997, 0.16920741831065142,
                  0.17643161520663211, 0.1838872729780587, 0.19157616625241872,
                  0.1994995880292134, 0.2076583139389731, 0.21605256720750904,
                  0.22468198470699438, 0.23354558449893306, 0.24264173529356356,
                  0.25196812826490195, 0.26152175166958896, 0.2712988687201525,
                  0.28129499915847617, 0.2915049049625136, 0.30192258059808524,
                  0.3125412481975823, 0.3233533580083874, 0.33435059440589016,
                  0.34552388770938475, 0.35686343197445924, 0.3683587088635268,
                  0.379998517617985, 0.3917710110724463, 0.4036637375651078,
                  0.4156636885103744, 0.4277573513121848, 0.4399307672111229,
                  0.4521695935773247, 0.46445917008640664, 0.47678458814903646,
                  0.48913076290805885, 0.5014825470989134, 0.5138252903148167,
                  0.52614475336236, 0.5384268124700569, 0.5506575162980125,
                  0.562823148965933, 0.5749102907994392, 0.5869058762340593,
                  0.5987972483626776, 0.6105722096661481, 0.6222190685269635,
                  0.6337266811908231, 0.6450844889092447, 0.6562825500664393,
                  0.6673115671640668, 0.6781629086067587, 0.6888286252981518,
                  0.6993014621203857, 0.7095748644286023, 0.7196429797450921,
                  0.7295006548846676, 0.7391434287832171, 0.748567521334848,
                  0.7577698185695475, 0.7667478545228855, 0.7754997901622199,
                  0.7840243897404574, 0.7923209949491556, 0.8003894972381231,
                  0.8082303086593177, 0.8158443315793568, 0.8232329275880066,
                  0.8303978859102519, 0.8373413916075844, 0.8440659938306112,
                  0.8505745743605023, 0.8568703166517162, 0.862956675563282,
                  0.8688373479411262, 0.8745162441897962, 0.8799974609487948,
                  0.885285254966785, 0.8903840182463507, 0.8952982545129311,
                  0.9000325570440681, 0.9045915878792561, 0.9089800584164809,
                  0.9132027113889593, 0.9172643042045857, 0.9211695936211227,
                  0.9249233217221263, 0.9285302031519149, 0.9319949135624533,
                  0.9353220792207426, 0.9385162677220663, 0.9415819797521529,
                  0.9445236418398535, 0.9473456000412215, 0.9500521144958056,
                  0.9526473547964547, 0.9551353961148861, 0.9575202160266227,
                  0.9598056919805767, 0.9619955993604944, 0.9640936100876154,
                  0.9661032917161894, 0.9680281069758875, 0.9698714137176128,
                  0.971636465221707, 0.9733264108300508, 0.97494429686603,
                  0.9764930678087825, 0.9779755676905075, 0.9793945416879257,
                  0.9807526378812041, 0.9820524091557733, 0.9832963152245083,
                  0.9844867247496648, 0.9856259175457837, 0.9867160868465044,
                  0.9877593416198336, 0.9887577089179306, 0.9897131362488805,
                  0.9906274939592373, 0.9915025776173381, 0.9923401103885116,
                  0.9931417453943473, 0.9939090680491464, 0.9946435983675493,
                  0.9953467932381465, 0.9960200486586009, 0.9966647019284915,
                  0.9972820337966827, 0.9978732705605825, 0.9984395861151466,
                  0.9989821039499278, 0.9995018990928831, 1,
                ],
                pmf: [
                  0, 0.0003559860144382004, 0.00037138870371051277,
                  0.00038755581432986074, 0.00040452415085817,
                  0.0004223321719861307, 0.00044102005244520733,
                  0.00046062974586749076, 0.0004812050484321014,
                  0.0005027916631102996, 0.0005254372642914925,
                  0.0005491915625402549, 0.0005741063691977457,
                  0.0006002356605024212, 0.0006276356408609516,
                  0.0006563648048537292, 0.0006864839975074715,
                  0.0007180564723120505, 0.000751147946397265,
                  0.0007858266522208415, 0.0008221633850465093,
                  0.0008602315454165534, 0.0009001071757398973,
                  0.0009418689900301796, 0.0009855983957344164,
                  0.0010313795064941372, 0.0010792991445752985,
                  0.0011294468315929118, 0.0011819147660403762,
                  0.0012367977860118264, 0.0012941933153800822,
                  0.0013542012915636371, 0.0014169240728822245,
                  0.001482466323366547, 0.0015509348727521348,
                  0.0016224385492526645, 0.0016970879825763813,
                  0.0017749953745239688, 0.0018562742343861266,
                  0.0019410390762541058, 0.002029405075261663,
                  0.002121487679704548, 0.002217402175932588,
                  0.0023172632028878384, 0.0024211842131737493,
                  0.00252927687759575, 0.0026416504302107027,
                  0.0027584109510821672, 0.002879660584153884,
                  0.0030054966879461964, 0.0031360109171487335,
                  0.0032712882336436294, 0.003411405846048321,
                  0.003556432077535948, 0.0037064251624668865,
                  0.0038614319732715174, 0.004021486680057668,
                  0.004186609346584352, 0.0043568044675517115,
                  0.004532059453606296, 0.004712343072041339,
                  0.004897603852896074, 0.005087768471989301,
                  0.005282740124372021, 0.005482396903719225,
                  0.005686590205267614, 0.005895143172033712,
                  0.006107849206150123, 0.006324470569211954,
                  0.006544737097456399, 0.006768345059365882,
                  0.0069949561848014485, 0.007224196895980695,
                  0.007455657771426594, 0.007688893274360009,
                  0.00792342177679467, 0.008158725909759718,
                  0.008394253268535934, 0.008629417499485342,
                  0.008863599791938681, 0.009096150794630498,
                  0.009326392971338388, 0.009553623404687017,
                  0.009777117050563555, 0.009996130438323647,
                  0.010209905804037411, 0.010417675635571666,
                  0.010618667599497034, 0.010812109810805104,
                  0.010997236397502774, 0.011173293303494591,
                  0.011339544265074497, 0.01149527688906754,
                  0.011639808754458192, 0.011772493454461297,
                  0.011892726492661543, 0.011999950945266569,
                  0.012093662801810401, 0.012173415898938111,
                  0.012238826366201827, 0.012289576509081912,
                  0.012325418062629823, 0.012346174759022388,
                  0.012351784190854531, 0.01234274321590334,
                  0.012319463047543278, 0.012282059107696863,
                  0.012230703827955658, 0.012165632667920478,
                  0.012087141833506232, 0.011995585434620093,
                  0.011891372128618238, 0.011774961303470555,
                  0.011646858860815401, 0.011507612663859579,
                  0.011357807718421653, 0.011198061157194572,
                  0.011029017097627491, 0.010851341442691842,
                  0.010665716691393157, 0.010472836822233877,
                  0.010273402308216606, 0.010068115316489767,
                  0.009857675139575584, 0.009642773898549506,
                  0.009424092551630903, 0.009202297234699452,
                  0.008978035953338015, 0.008751935639334407,
                  0.00852459957823748, 0.008296605208698238,
                  0.008068502288967494, 0.007840811421194527,
                  0.0076140229200390985, 0.007388596008649828,
                  0.007164958322245285, 0.006943505697332486,
                  0.006724602223026843, 0.006508580529891117,
                  0.006295742291213879, 0.006086358911565837,
                  0.005880672377844176, 0.005678896248670018,
                  0.005481216758998597, 0.005287794017990177,
                  0.00509876327956571, 0.004914236266580385,
                  0.004734302531137047, 0.004559030835187938,
                  0.004388470537224798, 0.004222652972478369,
                  0.004061592815626458, 0.0039052894165370056,
                  0.003753728101003606, 0.0036068814297886,
                  0.0034647104105384186, 0.0033271656582892772,
                  0.0031941885013236915, 0.0030657120300865426,
                  0.002941662087700636, 0.002821958201367991,
                  0.0027065144545841413, 0.00259524030064906,
                  0.0024880413184313888, 0.0023848199117366686,
                  0.002285475953954008, 0.002189907379917644,
                  0.0020980107271210136, 0.002009681628573956,
                  0.0019248152596981205, 0.0018433067417252813,
                  0.0017650515040942283, 0.0016899456083437903,
                  0.0016178860359792324, 0.0015487709427525198,
                  0.0014824998817249968, 0.0014189739974181936,
                  0.0013580961932784241, 0.0012997712745691503,
                  0.0012439060687350345, 0.0011904095251564772,
                  0.0011391927961188486, 0.0010901693007207003,
                  0.0010432547733292274, 0.0009983672980969915,
                  0.0009554273309498873, 0.0009143577103568612,
                  0.0008750836581007393, 0.0008375327711734881,
                  0.0008016350058357435, 0.000767322654799063,
                  0.0007345303184029817, 0.0007031948705971125,
                  0.0006732554204544883, 0.0006446532698906049,
                  0.0006173318681911288, 0.0005912367638998273,
                  0.0005663155545641008, 0.0005425178347812087,
                  0.0005197951429553038, 0.0004981009071168829,
                ],
              }}
              graphType={"pmf"}
              question={question}
              readOnly={false}
              height={100}
              width={650}
              showCP={false}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default NumericQuestionInput;
