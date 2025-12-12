import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PayPalbutton from "./PayPalbutton";

    const cart = {
     products: [
          {
            productId: 1,
            name: "T-shift",
            size: "M",
            color: "Red",
            quantity: 1,
            price: 1000,
            image: "https://picsum.photos/200?random=1",
        },
        {
            productId: 2,
            name: "Jeans",
            size: "L",
            color: "Black",
            quantity: 1,
            price: 1500,
            image: "https://picsum.photos/200?random=2",
        },
        ]
    };

const Checkout = () => {
  const navigate = useNavigate();
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

  const handleCreateCheckout = (e) => {
    e.preventDefault();
    setCheckoutId(123);
  }

  const handlePaymentSuccess = (details) => {
    console.log("Payment Success", details);
    navigate("/order-confirmation");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-10 px-6 tracking-tighter">
        {/* Left Section */}
        <div className="bg-gray-300  rounded-lg p-6">
            <h2 className="text-2xl uppercase mb-6">Checkout</h2>
            <form onSubmit={handleCreateCheckout}>
                <h3 className="text-lg mb-4">Contact Details</h3>
                <div className="mb-4">
                    <label className="block text-gray-700">Email</label>
                    <input type="email" value="user@example.com" className="w-full p-2 border rounded disabled"/>
                </div>
                <h3 className="text-lg mb-4">Delivery</h3>
                <div className="mv-4 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700">First Name</label>
                        <input 
                            type="text"
                            value={shippingAddress.firstName}
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
                            value={shippingAddress.lastName}
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
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress({...setShippingAddress, address: e.target.value,

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
                            value={shippingAddress.city}
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
                            value={shippingAddress.postalCode}
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
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({...setShippingAddress, country: e.target.value,
                        })
                    }
                    className="w-full p-2 border rounded required"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Phone Number</label>
                    <input 
                        type="text"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({...setShippingAddress, phone: e.target.value,
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
                            {/*  */}
                            <PayPalbutton 
                                amount={1000}
                                onSuccess={handlePaymentSuccess}
                                onError={(err) => alert("Payment failed. Try again.")}
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
                        kay={index}
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