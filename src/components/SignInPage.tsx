import { SignInForm } from "../SignInForm";
import { Toaster } from "sonner";

export function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-white font-bold text-2xl">📱</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CELLO CITY</h1>
          <p className="text-gray-600 text-sm">Mobile Shop Management System</p>
        </div>

        {/* Sign In Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <SignInForm />
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs">
            © 2024 Cello City. All rights reserved.
          </p>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
