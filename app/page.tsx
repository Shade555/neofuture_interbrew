"use client";
import BlurText from "../components/BlurText";
import StarBorder from "../components/StarBorder";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const handleAnimationComplete = () => {
    console.log("Animation completed!");
  };
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 home-no-scrollbar">
      <div className="text-center w-full max-w-4xl mx-auto">
        <BlurText
          text="Welcome to Interbrew"
          delay={200}
          animateBy="words"
          direction="top"
          onAnimationComplete={handleAnimationComplete}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold mb-3 text-center justify-center"
          animationFrom={{ filter: "blur(10px)", opacity: 0, y: -50 }}
          animationTo={[
            { filter: "blur(5px)", opacity: 0.5, y: 5 },
            { filter: "blur(0px)", opacity: 1, y: 0 },
          ]}
        />

        <motion.div
          className="italic text-base sm:text-lg mb-6 mt-[-3] text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.35, ease: "easeOut" }}
        >
          Brew Your Skills. Ace Your Interviews
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.35, ease: "easeOut" }}
        >
          <div className="text-sm sm:text-base text-gray-200 max-w-xl mx-auto mt-6 mb-8">
            Master concepts through guided learning with AI-powered mock
            interviews and real-time performance insights.
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <div className="flex flex-col w-full gap-3 items-center">
              <div className="flex flex-row gap-6 justify-center items-center w-full">
                <button
                  onClick={() => router.push("/auth/signup")}
                  className="bg-[#297356] border border-[#ffffff] text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-full font-medium hover:bg-[#1f5a44] transition min-w-55 text-sm sm:text-base"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => router.push("/auth/signin")}
                  className="bg-[#297356] border border-[#ffffff] text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-full font-medium hover:bg-[#1f5a44] transition min-w-55 text-sm sm:text-base"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
