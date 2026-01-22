import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In - Quizora Learn"
        description="This is the Sign In page for Quizora - Your Learning Platform"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
