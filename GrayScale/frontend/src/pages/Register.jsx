import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import registerpage from "../assets/registerpage.jpg"
import { registerUser } from "../../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "../../redux/slices/authSlice";
import { mergeCart } from "../../redux/slices/cartSlice";
import PageWrapper from "../components/Common/PageWrapper"; 
import { FaEye, FaEyeSlash } from "react-icons/fa";    

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmaiil] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const dispath = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, guestId, loading, error } = useSelector((state) => state.auth);
    const { cart } = useSelector((state) => state.cart);

    // Get the redirect parameter and check if it'c checkout or somthing else
    const redirect = new URLSearchParams(location.search).get("redirect") || "/";
    const isCheckoutRedirect = redirect.includes("checkout");
    const dispatch = useDispatch();

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

    useEffect(() => {
        if (user) {
            if (cart?.products?.length > 0 && guestId){
                dispath(mergeCart({ guestId, user})).then(() => {
                    navigate(isCheckoutRedirect ? "/checkout" : "/");
                });
            } else {
                navigate(isCheckoutRedirect ? "/checkout" : "/");
            }
        }
    }, [user, guestId, cart, dispath, navigate, isCheckoutRedirect]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispath(registerUser({ name, email, password }));
        
    }

  return (
    <PageWrapper loading={loading}>
    <div className="flex">
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12 ">
            <form onSubmit={handleSubmit} className="w-full max-w-md  p-8 rounded-lg border shadow-sm bg-gray-300">
                <div className="flex justify-center mb-6">
                    <h2 className="text-xl font-medium">GrayScale</h2>
                </div>
                <h2 className="text-2xl font-bold text-center mb-6">Hey There!</h2>
                <p className="text-center mb-6">Enter your name and password to Register</p>
                <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Name</label>
                    <input 
                        type="name"
                        value={name}
                        onChange={((e) => setName(e.target.value) )}
                        className="w-full p-2 border rounded" 
                        placeholder="Enter your name"
                    />
                 </div>
                 
                <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Email</label>
                    <input 
                        type="email"
                        value={email}
                        onChange={((e) => setEmaiil(e.target.value) )}
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
                <button 
                    type="submit"
                    className="w-full bg-black text-white p-2 rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                {loading ? "Registering..." : "Sign Up"}
                </button>
                <div className="mt-4 flex justify-center">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                />
                </div>

                <p className="mt-6 text-center text-sm">
                    Don't have an account?
                    <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-blue-500"> Login</Link>
                </p>
            </form>
        </div>
        <div className="hidden md:block w-1/2 bg-gray-800">
            <div className="h-full flex flex-col justify-center items-center">
                <img 
                    src={registerpage}
                    alt="Register to Account"
                    className="h-[750px] w-full object-cover"
                />
            </div>
        </div>
    
    </div>
    </PageWrapper>
  );        
};

export default Register;