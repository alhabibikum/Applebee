import { SignInForm } from "../SignInForm";
import { Toaster } from "sonner";

export function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <span className="text-teal-900 font-bold text-2xl">📱</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">CELLO CITY</h1>
          <p className="text-amber-100 text-sm">Mobile Shop Management System</p>
        </div>

        {/* Sign In Form Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-amber-200/30">
          <SignInForm />
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-amber-100/70 text-xs">
            © 2024 Cello City. All rights reserved.
          </p>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
