import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import registerpage from "../assets/registerpage.jpg"
import { registerUser } from "../../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { mergeCart } from "../../redux/slices/cartSlice";
import PageWrapper from "./PageWrapper";    

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmaiil] = useState("");
    const [password, setPassword] = useState("");
    const dispath = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, guestId } = useSelector((state) => state.auth);
    const { cart } = useSelector((state) => state.cart);
    const { loading } = useSelector((state) => state.auth);

    // Get the redirect parameter and check if it'c checkout or somthing else
    const redirect = new URLSearchParams(location.search).get("redirect") || "/";
    const isCheckoutRedirect = redirect.includes("checkout");

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
                <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Password</label>
                    <input 
                        type="password"
                        value={password}
                        onChange={((e) => setPassword(e.target.value) )}
                        className="w-full p-2 border rounded" 
                        placeholder="Enter your password"
                    />
                </div>
                <button 
                    type="submit"
                    className="w-full bg-black text-white p-2 rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                    Sign Up
                </button>
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