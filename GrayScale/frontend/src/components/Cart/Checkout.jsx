import axiosInstance from "../../utils/axiosInstance";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PayPalbutton from "./PayPalbutton";
//import GCashButton from "./GCashButton";
import { useDispatch, useSelector } from "react-redux";
import { createCheckout } from "../../../redux/slices/checkoutSlice";

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart, loading, error } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const [checkoutId, setCheckoutId] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
  });

  // Endure cart is not empty before proceeding to checkout
  useEffect(() => {
      if (!cart || !cart.products || cart.products.length === 0 ) {
    navigate("/");
    }
  }, [cart, navigate]);

const handleCreateCheckout = async (e) => {
  e.preventDefault();
  if (cart && cart.products.length > 0) {
    const res = await dispatch(
      createCheckout({
        checkoutItems: cart.products,
        shippingAddress,
        paymentMethod: "PayPal",
        totalPrice: cart.totalPrice,
      })
    );
    if (res.payload && res.payload._id) {
      setCheckoutId(res.payload._id); // Store checkout ID if checkout was successful
    }
  } 
}; 

  {/*  const handlePaymentSuccessGCash = async (details) => {
    try {
         await axiosInstance.put(
            `/api/checkout/${checkoutId}/pay`,
            { paymentStatus: "paid", paymentDetails: details },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                },
            }
        );
        
        await handleFinalizeCheckoutGCash(checkoutId); // Finalize checkout after payment is successful
    } catch (error) {
        console.error("Error verifying payment:", error);
    }
    navigate("/order-confirmation");
    };
  
 const handleFinalizeCheckoutGCash = async (checkoutId) => {
        try {
            await axiosInstance.post(
            `/api/checkout/${checkoutId}/finalize`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                }
            }
        );

        navigate("/order-confirmation");
        } catch (error) {
            console.log(error)  
        }
    }; */}



  const handlePaymentSuccessPayPal = async (details) => {
    try {
         await axiosInstance.put(
            `${import.meta.env.VITE_BACKEND_URL}/api/checkout/${checkoutId}/pay`,
            { paymentStatus: "paid", paymentDetails: details },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                },
            }
        );
        
        await handleFinalizeCheckoutPayPal(checkoutId); // Finalize checkout after payment is successful
    } catch (error) {
        console.error("Error verifying payment:", error);
    }
    navigate("/order-confirmation");
    };
  
    const handleFinalizeCheckoutPayPal = async (checkoutId) => {
        try {
            await axiosInstance.post(
            `/api/checkout/${checkoutId}/finalize`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                }
            }
        );

        navigate("/order-confirmation");
        } catch (error) {
            console.log(error)  
        }
    };

  {loading && (
    <div className="min-h-[200px] flex items-center justify-center">
        <p className="text-gray-500">Loading cart...</p>
    </div>
    )}
   
    {error && (
    <div className="min-h-[200px] flex items-center justify-center">
        <p>Error: {error}</p>
    </div>
    )}

    {!cart || !cart.products || cart.products.length === 0 && (
    <div className="min-h-[200px] flex items-center justify-center">
        <p>Your cart is empty.</p>
    </div>
    )}



  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-10 px-6 tracking-tighter">
        {/* Left Section */}
        <div className="bg-gray-300  rounded-lg p-6">
            <h2 className="text-2xl uppercase mb-6">Checkout</h2>
            <form onSubmit={handleCreateCheckout}>
                <h3 className="text-lg mb-4">Contact Details</h3>
                <div className="mb-4">
                    <label className="block text-gray-700">Email</label>
                    <input 
                        type="email" 
                        value={user? user.email : ""} 
                        readOnly
                        className="w-full p-2 border rounded disabled"
                    />
                </div>
                <h3 className="text-lg mb-4">Delivery</h3>
                <div className="mv-4 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700">First Name</label>
                        <input 
                            type="text"
                            value={shippingAddress.firstName || ""}
                            onChange={(e) => 
                                setShippingAddress({
                                    ...shippingAddress, 
                                    firstName: e.target.value,
                                })
                            }
                            className="w-full p-2 border rounded"
                        />
                    </div>
                     <div>
                        <label className="block text-gray-700">Last Name</label>
                        <input 
                            type="text"
                            value={shippingAddress.lastName || ""}
                            onChange={(e) => 
                                setShippingAddress({
                                    ...shippingAddress, 
                                    lastName: e.target.value,
                                })
                            }
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Address</label>
                    <input 
                        type="text"
                        value={shippingAddress.address || ""}
                        onChange={(e) => setShippingAddress({
                            ...shippingAddress, 
                            address: e.target.value,

                        })
                    }
                    className="w-full p-2 border rounded required"
                    />
                </div>
                <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700">City</label>
                        <input 
                            type="text"
                            value={shippingAddress.city || ""}
                            onChange={(e) => 
                                setShippingAddress({
                                    ...shippingAddress, 
                                    city: e.target.value,
                                })
                            }
                            className="w-full p-2 border rounded"
                        />
                    </div>
                     <div>
                        <label className="block text-gray-700">Postal Code</label>
                        <input 
                            type="text"
                            value={shippingAddress.postalCode || ""}
                            onChange={(e) => 
                                setShippingAddress({
                                    ...shippingAddress, 
                                    postalCode: e.target.value,
                                })
                            }
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Country</label>
                    <input 
                        type="text"
                        value={shippingAddress.country || ""}
                        onChange={(e) => setShippingAddress({
                            ...shippingAddress, 
                            country: e.target.value,
                        })
                    }
                    className="w-full p-2 border rounded required"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Phone Number</label>
                    <input 
                        type="text"
                        value={shippingAddress.phone || ""}
                        onChange={(e) => setShippingAddress({
                            ...shippingAddress, 
                            phone: e.target.value,
                        })
                    }
                    className="w-full p-2 border rounded required"
                    />
                </div>
                <div className="mb-4">
                    {!checkoutId ? (
                        <button  className="w-full bg-black text-white py-3 rounded">
                            Continue to Payment
                        </button>
                     ) : (
                    <div>
                        <h3 className="text-lg mb-4">Pay with PayPal</h3>
                           
                            {/* <GCashButton 
                                amount={cart.totalPrice}
                                onSuccess={handlePaymentSuccessGCash}
                                onError={() => alert("Payment failed. Try again.")}
                                  className="mb-2"

                            />*/}
                            
                            <PayPalbutton 
                                amount={cart.totalPrice}
                                onSuccess={handlePaymentSuccessPayPal}
                                onError={() => alert("Payment failed. Try again.")}
                            />
                          
                    </div>
                    )}    
                </div>
            </form>
        </div>
        {/* Right Section */}
        <div className="p-6 rounded-lg">
            <h3 className="text-lg mb-4">Summary</h3>
            <div className="border-t py-4 mb-4  max-h-[500px] overflow-y-auto">
                {cart.products.map((product, index) => (
                    <div
                        key={index}
                        className="flex items-start justify-between py-2 border-b"
                    >
                        <div className="flex items-start">
                            <img 
                                src={product.image}
                                alt={product.name}
                                className="w-20 h-24 object-coverr rounded mr-4"
                            />
                            <div>
                                <h3 className="text-md">{product.name}</h3>
                                <p className="text-gray-500">{product.size}</p>
                                <p className="text-gray-500">{product.color}</p>
                            </div>
                        </div>
                        <p className="text-xl">₱{product.price?.toLocaleString()}</p>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center text-lg mb-4">
                <p>Subtotal</p>
                <p>₱{cart.totalPrice?.toLocaleString()}</p>
            </div>
            <div className="flex justify-between items-center text-lg">
                <p>Shpping</p>
                <p>Free</p>
            </div>
            <div className="flex justify-between items-center text-lg mt-4 border-t pt-4">
                <p>Total</p>
                <p>₱{cart.totalPrice?.toLocaleString()}</p>
            </div>
        </div>
    </div>
  );
};

export default Checkout;