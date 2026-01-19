import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Signup - Quizora Learn"
        description="This is the Signup page for Quizora Learn"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
