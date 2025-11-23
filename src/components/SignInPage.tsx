import { SignInForm } from "../SignInForm";
import { Toaster } from "sonner";

export function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-400/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-400/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <span className="text-teal-900 font-bold text-5xl">📱</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">CELLO CITY</h1>
          <p className="text-amber-100 text-base tracking-wide">Mobile Shop Management System</p>
        </div>

        {/* Sign In Form Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-amber-200/50">
          <SignInForm />
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-amber-100/60 text-xs">
            © 2024 Cello City. All rights reserved.
          </p>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
