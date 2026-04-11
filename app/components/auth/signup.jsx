"use client";
import StarBorder from "../../../components/StarBorder";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupComponent() {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [signinData, setSigninData] = useState({
    email: "",
    password: "",
  });

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            name: signupData.name,
          },
        },
      });

      // Log the full response for debugging
      console.log("Signup response:", { data, error });

      // Handle the specific case where user is created but there's a database trigger error
      if (error) {
        console.error("Signup error details:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });

        // If user was still created despite the error, proceed with success
        if (data?.user) {
          console.warn("User created despite error - likely a trigger issue");
          alert(
            "Account created! Please check your email to confirm. (Note: Some profile features may need setup)",
          );
          router.push("/dashboard");
          return;
        }

        // Otherwise show the error
        alert(error.message);
        return;
      }

      // Normal success case
      if (data?.user) {
        alert("Signup successful! Please check your email to confirm.");
        router.push("/dashboard");
      } else {
        console.error("Unexpected signup response - no user data");
        alert("Signup completed but please try signing in.");
      }
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const handleSigninSubmit = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: signinData.email,
      password: signinData.password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/dashboard");
  };

  const handleSignupChange = (e) => {
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSigninChange = (e) => {
    setSigninData({
      ...signinData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px rgba(63, 147, 113, 0.1) inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
          }
        `,
        }}
      />
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div
          className="relative w-full max-w-md"
          style={{ perspective: "1000px" }}
        >
          <div
            className="relative w-full transition-transform duration-700 ease-in-out"
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Sign Up Card (Front) */}
            <div
              className="w-full"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <div className="border border-white rounded-2xl p-5 backdrop-blur-xl bg-black/10">
                <div>
                  <h2 className="text-center text-3xl font-bold text-white">
                    Create your account
                  </h2>
                  <p className="mt-2 text-center text-sm text-gray-300">
                    Or{" "}
                    <button
                      type="button"
                      onClick={() => setIsFlipped(true)}
                      className="font-medium text-[#3f9371] hover:text-[#297356]"
                    >
                      sign in to your account
                    </button>
                  </p>
                </div>
                <form className="mt-6 space-y-6" onSubmit={handleSignupSubmit}>
                  <div className="rounded-md shadow-sm space-y-4">
                    <div>
                      <label htmlFor="signup-name" className="sr-only">
                        Full Name
                      </label>
                      <input
                        id="signup-name"
                        name="name"
                        type="text"
                        required
                        className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-400 text-white bg-[#3f9371]/10 backdrop-blur-sm focus:outline-none focus:ring-[#3f9371] focus:border-[#3f9371] focus:z-10 sm:text-sm [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:active]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset]"
                        placeholder="Full Name"
                        value={signupData.name}
                        onChange={handleSignupChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="signup-email" className="sr-only">
                        Email address
                      </label>
                      <input
                        id="signup-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-400 text-white bg-[#3f9371]/10 backdrop-blur-sm focus:outline-none focus:ring-[#3f9371] focus:border-[#3f9371] focus:z-10 sm:text-sm [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:active]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset]"
                        placeholder="Email address"
                        value={signupData.email}
                        onChange={handleSignupChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="signup-password" className="sr-only">
                        Password
                      </label>
                      <input
                        id="signup-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-400 text-white bg-[#3f9371]/10 backdrop-blur-sm focus:outline-none focus:ring-[#3f9371] focus:border-[#3f9371] focus:z-10 sm:text-sm [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:active]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset]"
                        placeholder="Password"
                        value={signupData.password}
                        onChange={handleSignupChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="signup-confirmPassword"
                        className="sr-only"
                      >
                        Confirm Password
                      </label>
                      <input
                        id="signup-confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-400 text-white bg-[#3f9371]/10 backdrop-blur-sm focus:outline-none focus:ring-[#3f9371] focus:border-[#3f9371] focus:z-10 sm:text-sm [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:active]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset]"
                        placeholder="Confirm Password"
                        value={signupData.confirmPassword}
                        onChange={handleSignupChange}
                      />
                    </div>
                  </div>

                  <div>
                    <StarBorder
                      as="button"
                      type="submit"
                      color="#3f9371"
                      speed="4s"
                      className="w-full flex justify-center py-2 px-4 text-sm font-medium rounded-full text-white"
                    >
                      Sign up
                    </StarBorder>
                  </div>

                  <div className="mt-6">
                    <div className="text-center text-sm mb-6">
                      <span className="text-gray-400">Or continue with</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          const { error } = await supabase.auth.signInWithOAuth(
                            {
                              provider: "google",
                              options: {
                                redirectTo: `${window.location.origin}/dashboard`,
                                queryParams: {
                                  prompt: "select_account",
                                },
                              },
                            },
                          );
                          if (error) alert(error.message);
                        }}
                        className="w-full inline-flex justify-center items-center py-2 px-4 rounded-lg shadow-sm bg-white/5 backdrop-blur-sm text-sm font-medium text-white hover:bg-white/10 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Google
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const { error } = await supabase.auth.signInWithOAuth(
                            {
                              provider: "github",
                              options: {
                                redirectTo: `${window.location.origin}/dashboard`,
                              },
                            },
                          );
                          if (error) alert(error.message);
                        }}
                        className="w-full inline-flex justify-center items-center py-2 px-4 rounded-lg shadow-sm bg-white/5 backdrop-blur-sm text-sm font-medium text-white hover:bg-white/10 transition-colors"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        GitHub
                      </button>
                    </div>
                  </div>
                </form>
                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    ← Back to home
                  </button>
                </div>
              </div>
            </div>

            <div
              className="absolute top-0 left-0 w-full"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="border border-white rounded-2xl p-5 backdrop-blur-xl bg-black/10 py-16">
                <div>
                  <h2 className="text-center text-3xl font-bold text-white">
                    Welcome back
                  </h2>
                  <p className="mt-2 text-center text-sm text-gray-300">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsFlipped(false)}
                      className="font-medium text-[#3f9371] hover:text-[#297356]"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
                <form className="mt-6 space-y-6" onSubmit={handleSigninSubmit}>
                  <div className="rounded-md shadow-sm space-y-4">
                    <div>
                      <label htmlFor="signin-email" className="sr-only">
                        Email address
                      </label>
                      <input
                        id="signin-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-400 text-white bg-[#3f9371]/10 backdrop-blur-sm focus:outline-none focus:ring-[#3f9371] focus:border-[#3f9371] focus:z-10 sm:text-sm [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:active]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset]"
                        placeholder="Email address"
                        value={signinData.email}
                        onChange={handleSigninChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="signin-password" className="sr-only">
                        Password
                      </label>
                      <input
                        id="signin-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-400 text-white bg-[#3f9371]/10 backdrop-blur-sm focus:outline-none focus:ring-[#3f9371] focus:border-[#3f9371] focus:z-10 sm:text-sm [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset] [&:-webkit-autofill:active]:[-webkit-box-shadow:0_0_0px_1000px_rgba(63,147,113,0.1)_inset]"
                        placeholder="Password"
                        value={signinData.password}
                        onChange={handleSigninChange}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-[#3f9371] focus:ring-[#3f9371] border-gray-600 rounded bg-gray-800"
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-2 block text-sm text-gray-300"
                      >
                        Remember me
                      </label>
                    </div>

                    <div className="text-sm">
                      <a
                        href="#"
                        className="font-medium text-[#3f9371] hover:text-[#297356]"
                      >
                        Forgot password?
                      </a>
                    </div>
                  </div>

                  <div>
                    <StarBorder
                      as="button"
                      type="submit"
                      color="#3f9371"
                      speed="4s"
                      className="w-full flex justify-center py-4 px-4 text-sm font-medium rounded-full text-white"
                    >
                      Sign in
                    </StarBorder>
                  </div>

                  <div className="mt-6">
                    <div className="text-center text-sm mb-6">
                      <span className="text-gray-400">Or continue with</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          const { error } = await supabase.auth.signInWithOAuth(
                            {
                              provider: "google",
                              options: {
                                redirectTo: `${window.location.origin}/dashboard`,
                                queryParams: {
                                  prompt: "select_account",
                                },
                              },
                            },
                          );
                          if (error) alert(error.message);
                        }}
                        className="w-full inline-flex justify-center items-center py-2 px-4 rounded-lg shadow-sm bg-white/5 backdrop-blur-sm text-sm font-medium text-white hover:bg-white/10 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Google
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const { error } = await supabase.auth.signInWithOAuth(
                            {
                              provider: "github",
                              options: {
                                redirectTo: `${window.location.origin}/dashboard`,
                              },
                            },
                          );
                          if (error) alert(error.message);
                        }}
                        className="w-full inline-flex justify-center items-center py-2 px-4 rounded-lg shadow-sm bg-white/5 backdrop-blur-sm text-sm font-medium text-white hover:bg-white/10 transition-colors"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        GitHub
                      </button>
                    </div>
                  </div>
                </form>
                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    ← Back to home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
