import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { useState } from "react";
import { Modal } from "../components/ui/modal";

export default function UserProfiles() {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const closeModal = () => setIsOpen(false);
  return (
    <>
      <PageMeta
        title="User profile - Quizora Learn"
        description="This is the user profile page for Quizora Learn"
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard />
          <UserInfoCard />
        </div>

        <div className="space-y-6 mt-4">
          <Button className="bg-red-600/55 hover:bg-red-700" onClick={() => setIsOpen(true)}>Delete my account</Button>
        </div>
      </div>

    <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Delete Account
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Are you sure you want to delete your account?\ All of your data will be permanently removed. This action cannot be undone.
          </p>
        </div>
        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
          <Button size="sm" variant="outline" onClick={closeModal}>
            Close
          </Button>
          <Button size="sm" className="bg-red-600/55 hover:bg-red-700">
            Delete Account
          </Button>
        </div>
      </div>
    </Modal>
    </>
  );
}
