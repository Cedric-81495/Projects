// frontend/src/pages/Login.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { GoogleLogin } from "@react-oauth/google";
import loginpage from "../assets/loginpage.jpg";
import PageWrapper from "../components/Common/PageWrapper";
import { loginUser, loginWithGoogle } from "../../redux/slices/authSlice";
import usePostLoginRedirect from "../hooks/usePostLoginRedirect";
import { FaEye, FaEyeSlash } from "react-icons/fa"; 

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  // Merges the guest cart once, then returns to the page that sent us here (e.g. /order/123)
  const redirect = usePostLoginRedirect();

  // Email/password login
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  // Google login success handler
  const handleGoogleSuccess = (credentialResponse) => {
    if (!credentialResponse?.credential) {
      console.error("No ID token received from Google");
      return;
    }
    dispatch(loginWithGoogle(credentialResponse.credential));
  };

  const handleGoogleError = () => {
    console.error("Google login failed");
  };

  return (
    <PageWrapper loading={loading}>
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Login Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-gray-300 p-8 rounded-lg border shadow-sm"
          >
            <div className="flex justify-center mb-6">
              <h2 className="text-xl font-medium">GrayScale</h2>
            </div>
            <h2 className="text-2xl font-bold text-center mb-6">Hey There!</h2>
            <p className="text-center mb-6">
              Enter your email and password to Login
            </p>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter your email address"
              />
            </div>

            <div className="mb-4 relative">
                <label className="block text-sm font-semibold mb-2">Password</label>
                <input
                    type={showPassword ? "text" : "password"} // 🔹 toggle type
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded pr-10"
                    placeholder="Enter your password"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 pt-7 pr-5  transform -translate-y-1/2 text-gray-600"
                >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
            {error && ( 
              <div className="mb-4 text-sm text-gray-600 text-center">
                  {error}
              </div>
                        )}
            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-black text-white p-2 rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              {loading ? "Logging in..." : "Sign In"}
            </button>

            {/* Google Login */}
            <div className="w-full mt-4 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />
            </div>

            <p className="mt-6 text-center text-sm">
              Don't have an account?
              <Link
                to={`/register?redirect=${encodeURIComponent(redirect)}`}
                className="text-blue-500 ml-1"
              >
                Register
              </Link>
            </p>
          </form>
        </div>

        {/* Image Section */}
        <div className="hidden md:block w-full md:w-1/2 bg-gray-800">
          <div className="h-full flex flex-col justify-center items-center">
            <img
              src={loginpage}
              alt="Login to Account"
              className="h-[750px] w-full object-cover"
            />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Login;
