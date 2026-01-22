import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import QuizMetrics from "../../components/quiz/QuizMetrics";
import QuizCategory from "../../components/quiz/QuizCategory";
import QuizSource from "../../components/quiz/QuizSource";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Dashboard - Quizora Learn"
        description="Welcome to quizora learn dashboard"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-12">
          <QuizMetrics />

          {/* <MonthlyTarget /> */}
        </div>
        
        <div className="col-span-12 xl:col-span-12">
          {/* <MonthlySalesChart /> */}
          <ComponentCard title="Generate Quiz from any Source !">
            <QuizSource />
          </ComponentCard>

          <ComponentCard title="Select Quiz Category" className="mt-6">
            <QuizCategory />
          </ComponentCard>

        </div>

        {/* <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div> */}
      </div>
    </>
  );
}
