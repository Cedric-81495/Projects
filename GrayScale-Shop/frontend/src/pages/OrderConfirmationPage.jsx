const checkout = {
    _id: "1234",
    createdAt: new Date(),
    checkoutItems: [
        {
            productId: "1",
            name: "Jacket",
            color: "gray",
            size: "M",
            price: 1500,
            quantity: 1,
            image: "https://picsum.photos/150?random=1",
        },
                {
            productId: "2",
            name: "Jeans",
            color: "black",
            size: "M",
            price: 1600,
            quantity: 1,
            image: "https://picsum.photos/150?random=2",
        },
    ],
    shippingAddress: {
        address: "122 Bonifacio Street",
        city: "Manila",
        country: "Philippines",
    },
};


const OrderConfirmationPage = () => {

  const calculatedEstimatedDelivery = () => {
    const orderDate = new Date(checkout.createdAt);
        orderDate.setDate(orderDate.getDate() + 10); // Add 10 days to the order date
        return orderDate.toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
        <h1 className="text-4xl font-bold text-center text-emerald-700 mb-8">Thank You for Your Order</h1>
        {checkout && (
        <div className="p-6 rounded-lg  bg-gray-300 border">
            <div className="flex justify-between  mb-20">
                {/* Order ID and Date */}
                <div>
                    <h2 className="text-xl font-semibold mb-2">Order ID: {checkout._id}</h2>
                    <p className="text-gray-500">
                        Order date: {new Date(checkout.createdAt).toLocaleDateString()}
                    </p>
                </div>
                {/* Estimated Delivery */}
                <div>
                    <p className="text-emerald-700 text-sm">
                        Estimated Delivery: {calculatedEstimatedDelivery(checkout.createdAt)}
                    </p>
                </div>
            </div>
            {/* Ordered Items */}
            <div className="mb-20">
                {checkout.checkoutItems.map((item) => (
                    <div key={item.productId} className="flex items-center mb-4">
                        <img 
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 rouneded-md mr-4"
                        />
                        <div>
                            <h4 className="text-md font-semibold">{item.name}</h4>
                            <p className="text-sm text-gray-600">{item.color} | {item.size}</p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-md">₱{item.price.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                    </div>
                ))}
            </div>
             {/* Payment and Delivery Info */}
            <div className="grid grid-cols-2 gap-8">
                {/* Payment */}
                <div>
                    <h4 className="text-lg font-semibold mb-2">Payment</h4>
                    <p className="text-gray-600">PayPal</p>
                </div>
                {/* Delivery Info */}
                <div>
                    <h4 className="text-lg font-semibold mb-2">Delivery</h4>
                    <p className="text-gray-600">
                        {checkout.shippingAddress.address}
                    </p>
                    <p className="text-gray-600">
                        {checkout.shippingAddress.city}{", "}
                        {checkout.shippingAddress.country}  
                    </p>
                </div>
            </div>
         
        </div>
        )}
    </div> 
  );
};

export default OrderConfirmationPage;