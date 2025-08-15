import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MediaSans } from "@/utils/fonts";
import { UserAuth } from "@/context/AuthContext";

const Signup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signUpNewUser } = UserAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signUpNewUser(email, password);

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.error?.message || "Sign up failed");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col justify-between bg-[#f8f9fa] px-4">
      {/* Logo */}
      <div className="w-full flex justify-start items-center mt-6 ml-6">
        <div className="flex justify-start items-end">
          <a
            href="/"
            className={`${MediaSans.className} text-[40px] leading-[92%] text-[#1B1B1B] cursor-pointer`}
          >
            Askademia
          </a>
          <div className="w-3 h-3 rounded-full bg-[#FC3E6B] ml-1" />
        </div>
      </div>

      {/* Center Form */}
      <div className="flex flex-col items-center">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className={`${MediaSans.className} text-[35px] leading-[92%] text-[#1B1B1B] cursor-pointer`}>Sign Up</h2>
          <p className="text-gray-600 mt-2">
            Create an account to get started!
          </p>
        </div>

        {/* Sign Up Form */}
        <form onSubmit={handleSignUp} className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">

          {/* Email */}
          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-medium">Email</label>
            <input
              type="email"
              placeholder="Your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              onChange={(e) => setEmail(e.target.value)}
              id="email"
              name="email"
            />
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-medium">
              Password
            </label>
            <input
              type="password"
              placeholder="Create a password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              onChange={(e) => setPassword(e.target.value)}
              id="password"
              name="password"
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-red-600 text-center mb-4">{error}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg flex justify-center items-center hover:bg-gray-900 transition"
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>

          {/* Login Link */}
          <p className="text-sm text-gray-600 text-center mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-black font-medium hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>

      {/* Footer */}
      <footer className="text-sm text-gray-500 text-center py-4">
        © {new Date().getFullYear()} Askademia
      </footer>
    </div>
  );
};

export default Signup;