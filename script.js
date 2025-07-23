document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Cache ---
    const cartCountElement = document.querySelector('.cart-count');
    const cartItemsElement = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutButton = document.querySelector('.checkout-btn');
    const addToCartButtons = document.querySelectorAll('.add-to-cart'); // Correctly query all 'Add to Cart' buttons

    const productGrid = document.querySelector('.product-grid'); // Used for event delegation on quantity buttons

    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    const cardDetailsDiv = document.getElementById('payment-details-card');
    const upiDetailsDiv = document.getElementById('payment-details-upi');

    // New input fields added in index.html
    const userNameInput = document.getElementById('user-name'); // Added for user's name
    const addressInput = document.getElementById('address');
    const mobileInput = document.getElementById('mobile');

    let cart = []; // Array to store cart items

    // --- Cart Functionality ---

    /**
     * Updates the cart UI based on the current `cart` array.
     * Clears existing items, calculates total, and updates counts.
     */
    function updateCartUI() {
        cartItemsElement.innerHTML = ''; // Clear current cart items
        let total = 0;
        let totalCartItems = 0; // To count total number of items (sum of quantities)

        if (cart.length === 0) {
            cartItemsElement.innerHTML = '<p class="cart-empty-message">Your cart is empty.</p>';
        } else {
            cart.forEach(item => {
                total += item.price * item.quantity; // Calculate total with quantity
                totalCartItems += item.quantity; // Sum up quantities for total item count

                const cartItemHTML = `
                    <div class="cart-item" data-id="${item.id}">
                        <img src="${item.image}" alt="${item.name}">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p>₹${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div class="cart-item-actions">
                            <input type="number" value="${item.quantity}" min="1" class="cart-item-qty" data-id="${item.id}">
                            <button class="remove-from-cart-btn" data-id="${item.id}">Remove</button>
                        </div>
                    </div>
                `;
                cartItemsElement.insertAdjacentHTML('beforeend', cartItemHTML);
            });
        }

        cartTotalElement.innerText = `₹${total.toFixed(2)}`;
        cartCountElement.innerText = totalCartItems;
    }

    // --- Event Delegation for Cart Item Actions (Quantity & Remove) ---
    cartItemsElement.addEventListener('change', (e) => {
        if (e.target.classList.contains('cart-item-qty')) {
            const productId = e.target.dataset.id;
            const newQuantity = parseInt(e.target.value);
            const cartItem = cart.find(item => item.id === productId);

            if (cartItem) {
                if (newQuantity >= 1) {
                    cartItem.quantity = newQuantity;
                } else {
                    cart = cart.filter(item => item.id !== productId);
                }
                updateCartUI();
            }
        }
    });

    cartItemsElement.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-from-cart-btn')) {
            const productIdToRemove = e.target.dataset.id;
            cart = cart.filter(item => item.id !== productIdToRemove);
            updateCartUI();
        }
    });


    // Event listener for adding items to cart
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.product-card');

            // Handle 'coming soon' cards gracefully
            if (card.classList.contains('coming-soon')) {
                alert('This item is coming soon and cannot be added to the cart yet!');
                return;
            }

            const productId = card.dataset.id;
            const productName = card.dataset.name;
            const productPrice = parseFloat(card.dataset.price);
            const productQuantityInput = card.querySelector(`.product-qty[data-id="${productId}"]`);
            const quantity = parseInt(productQuantityInput ? productQuantityInput.value : 1);

            const product = {
                id: productId,
                name: productName,
                price: productPrice,
                quantity: quantity,
                image: card.querySelector('.product-image.active')?.src || card.querySelector('.product-image')?.src || '',
            };

            const existingProduct = cart.find(item => item.id === product.id);
            if (existingProduct) {
                existingProduct.quantity += quantity;
                alert(`Added ${quantity} more of ${product.name} to your cart. Total: ${existingProduct.quantity}`);
            } else {
                cart.push(product);
                alert(`${product.name} added to cart.`);
            }
            updateCartUI();
        });
    });

    // --- Product Quantity Selectors (on product cards) ---
    productGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('increase-qty')) {
            const productId = e.target.dataset.id;
            const qtyInput = productGrid.querySelector(`.product-qty[data-id="${productId}"]`);
            if (qtyInput) {
                qtyInput.value = parseInt(qtyInput.value) + 1;
            }
        } else if (e.target.classList.contains('decrease-qty')) {
            const productId = e.target.dataset.id;
            const qtyInput = productGrid.querySelector(`.product-qty[data-id="${productId}"]`);
            if (qtyInput && parseInt(qtyInput.value) > 1) {
                qtyInput.value = parseInt(qtyInput.value) - 1;
            }
        }
    });


    // --- Checkout Functionality ---
    checkoutButton.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty. Please add items before checking out.');
            return;
        }

        const userName = userNameInput.value.trim(); // Get user name
        const address = addressInput.value.trim();
        const mobile = mobileInput.value.trim();

        if (!userName) { // Validate user name
            alert('Please enter your name.');
            return;
        }
        if (!address) {
            alert('Please enter your full address.');
            return;
        }
        if (!mobile) {
            alert('Please enter your mobile number.');
            return;
        }
        if (!/^\d{10}$/.test(mobile)) {
            alert('Please enter a valid 10-digit mobile number.');
            return;
        }

        const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked');

        if (!selectedPaymentMethod) {
            alert('Please select a payment method.');
            return;
        }

        const methodValue = selectedPaymentMethod.value;
        let confirmationMessage = '';

        // Prepare the order data to send to your Google Apps Script Web App
        const orderData = {
            userName: userName,
            address: address,
            mobile: mobile,
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            total: parseFloat(cartTotalElement.innerText.replace('₹', '')),
            paymentType: selectedPaymentMethod.value,
            orderDate: new Date().toLocaleString()
        };

        // --- Fetch call to your Google Apps Script Web App ---
        // REPLACE 'YOUR_WEB_APP_URL_HERE' with the URL you copied from Apps Script deployment
        const webAppUrl = 'https://script.google.com/macros/s/AKfycbzBwaYE530sHXtuZ4-JCnfauqs-E0XqyKhTPnxAMot99cU9y5yQTdrINjB_8I13NSAZOg/exec'; // PASTE YOUR WEB APP URL HERE

        fetch(webAppUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
            mode: 'no-cors' // Use 'no-cors' if you encounter CORS issues.
                            // This means you won't get a proper response back from the Apps Script.
        })
        .then(response => {
             console.log('Order data sent to Google Sheet Web App.');
             // Since using 'no-cors', we can't reliably check response.ok or parse JSON response here.
             // We'll assume success for the client-side UI update after sending the request.
             return {};
        })
        .then(data => {
            // This part will execute even if the backend failed when using 'no-cors',
            // as 'no-cors' prevents network errors from propagating to .catch.
            // For robust error handling, remove 'no-cors' and set up CORS on Apps Script.
            switch (methodValue) {
                case 'cod':
                    confirmationMessage = 'Your order has been placed successfully!\nPayment will be collected on delivery.';
                    break;
                case 'card':
                    const cardNumber = cardDetailsDiv.querySelector('input[placeholder="Card Number"]').value.trim();
                    const expiry = cardDetailsDiv.querySelector('input[placeholder="MM/YY"]').value.trim();
                    const cvv = cardDetailsDiv.querySelector('input[placeholder="CVV"]').value.trim();
                    const cardHolderName = cardDetailsDiv.querySelector('input[placeholder="Card Holder Name"]').value.trim();

                    if (!cardNumber || !expiry || !cvv || !cardHolderName) {
                        alert('Please fill in all card details.');
                        return; // Prevent clearing cart if card details are missing
                    }
                    confirmationMessage = 'Card payment simulated. Your order has been placed successfully!';
                    break;
                case 'upi':
                    const upiId = upiDetailsDiv.querySelector('input[placeholder="Your UPI ID (e.g., example@bank)"]').value.trim();
                    if (!upiId) {
                        alert('Please enter your UPI ID.');
                        return; // Prevent clearing cart if UPI ID is missing
                    }
                    if (!upiId.includes('@')) {
                        alert('Please enter a valid UPI ID (e.g., name@bank).');
                        return; // Prevent clearing cart if UPI ID is invalid
                    }
                    confirmationMessage = `UPI payment request simulated for ${upiId}. Your order will be confirmed upon successful payment.`;
                    break;
                default:
                    confirmationMessage = 'An unknown payment method was selected.';
                    alert(confirmationMessage);
                    return; // Prevent clearing cart if payment method is unknown
            }

            alert(confirmationMessage);
            cart = [];
            updateCartUI();
            toggleCart();
            userNameInput.value = ''; // Clear user name
            addressInput.value = '';
            mobileInput.value = '';
        })
        .catch((error) => {
            console.error('Error sending order to Google Sheet:', error);
            alert('There was an error placing your order. Please try again. (Check console for details)');
        });
    });

    // --- Payment Method Selection Logic ---
    function showPaymentDetails() {
        cardDetailsDiv.classList.add('hidden');
        upiDetailsDiv.classList.add('hidden');

        const selectedMethod = document.querySelector('input[name="payment-method"]:checked');
        if (selectedMethod) {
            if (selectedMethod.value === 'card') {
                cardDetailsDiv.classList.remove('hidden');
            } else if (selectedMethod.value === 'upi') {
                upiDetailsDiv.classList.remove('hidden');
            }
        }
    }

    paymentMethods.forEach(radio => {
        radio.addEventListener('change', showPaymentDetails);
    });

    showPaymentDetails();


    // --- Product Image Slider Functionality ---
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const imageContainer = card.querySelector('.product-image-container');

        if (imageContainer && !card.classList.contains('coming-soon')) {
            const images = imageContainer.querySelectorAll('.product-image');
            const prevBtn = imageContainer.querySelector('.prev-btn');
            const nextBtn = imageContainer.querySelector('.next-btn');
            let currentImageIndex = 0;

            if (images.length > 0 && prevBtn && nextBtn) {
                function showImage(index) {
                    const prevActiveImage = imageContainer.querySelector('.product-image.active');
                    if (prevActiveImage) {
                        prevActiveImage.classList.remove('active');
                    }
                    images[index].classList.add('active');
                }

                prevBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentImageIndex = (currentImageIndex > 0) ? currentImageIndex - 1 : images.length - 1;
                    showImage(currentImageIndex);
                });

                nextBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentImageIndex = (currentImageIndex < images.length - 1) ? currentImageIndex + 1 : 0;
                    showImage(currentImageIndex);
                });

                showImage(0);
            }
        }
    });

    // Initial cart UI update (in case items are loaded from localStorage later)
    updateCartUI();
});


// --- Global Toggle Cart Sidebar Visibility ---
function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    cartSidebar.classList.toggle('open');
    cartOverlay.classList.toggle('open');
}
