document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Cache ---
    // Caching DOM elements improves performance by avoiding repeated lookups.
    const cartCountElement = document.querySelector('.cart-count');
    const cartItemsElement = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutButton = document.querySelector('.checkout-btn');
    const addToCartButtons = document.querySelectorAll('.add-to-cart'); // Re-queried here for clarity within scope

    const productGrid = document.querySelector('.product-grid'); // Used for event delegation on quantity buttons

    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    const cardDetailsDiv = document.getElementById('payment-details-card');
    const upiDetailsDiv = document.getElementById('payment-details-upi');

    const addressInput = document.getElementById('address'); // New: Address input field
    const mobileInput = document.getElementById('mobile'); // New: Mobile input field

    let cart = []; // Array to store cart items

    // --- Cart Functionality ---

    /**
     * Updates the cart UI based on the current `cart` array.
     * Clears existing items, calculates total, and updates counts.
     * Also handles adding/removing items and quantity changes.
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

                // Using template literals for cleaner HTML construction
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
                // More efficient way to add HTML to an element
                cartItemsElement.insertAdjacentHTML('beforeend', cartItemHTML);
            });

            // (Self-correction: The event listeners for cart quantity and remove were re-attached inside `updateCartUI` on every call.
            // This is inefficient and can lead to multiple listeners. I will move them outside,
            // and use event delegation on `cartItemsElement` which is static.)
        }

        cartTotalElement.innerText = `₹${total.toFixed(2)}`;
        cartCountElement.innerText = totalCartItems; // Display total quantity of items
    }

    // --- Event Delegation for Cart Item Actions (Quantity & Remove) ---
    // This listener is added ONLY ONCE when the DOM is loaded.
    // It listens for clicks/changes on the static 'cartItemsElement' and
    // then checks if the event originated from a '.cart-item-qty' input or a '.remove-from-cart-btn'.
    cartItemsElement.addEventListener('change', (e) => {
        if (e.target.classList.contains('cart-item-qty')) {
            const productId = e.target.dataset.id;
            const newQuantity = parseInt(e.target.value);
            const cartItem = cart.find(item => item.id === productId);

            if (cartItem) {
                if (newQuantity >= 1) {
                    cartItem.quantity = newQuantity;
                } else {
                    // If quantity goes below 1, remove the item from the cart
                    cart = cart.filter(item => item.id !== productId);
                }
                updateCartUI(); // Re-render cart to update total and items
            }
        }
    });

    cartItemsElement.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-from-cart-btn')) {
            const productIdToRemove = e.target.dataset.id;
            cart = cart.filter(item => item.id !== productIdToRemove);
            updateCartUI(); // Re-render cart after removal
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
            // Get quantity from the input field on the product card
            const productQuantityInput = card.querySelector(`.product-qty[data-id="${productId}"]`);
            const quantity = parseInt(productQuantityInput ? productQuantityInput.value : 1);

            const product = {
                id: productId,
                name: productName,
                price: productPrice,
                quantity: quantity, // Include quantity in the product object
                // Ensure to get the SRC of the *currently active* image for the cart thumbnail
                image: card.querySelector('.product-image.active')?.src || card.querySelector('.product-image')?.src || '',
            };

            // Check if product is already in cart
            const existingProduct = cart.find(item => item.id === product.id);
            if (existingProduct) {
                // If exists, update quantity
                existingProduct.quantity += quantity;
                alert(`Added ${quantity} more of ${product.name} to your cart. Total: ${existingProduct.quantity}`);
            } else {
                cart.push(product);
                alert(`${product.name} added to cart.`);
            }
            updateCartUI(); // Update UI after adding
        });
    });

    // --- Product Quantity Selectors (on product cards) ---
    // Using event delegation on the product grid for efficiency
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
            if (qtyInput && parseInt(qtyInput.value) > 1) { // Prevent quantity from going below 1
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

        const address = addressInput.value.trim();
        const mobile = mobileInput.value.trim();

        if (!address) {
            alert('Please enter your full address.');
            return;
        }

        if (!mobile) {
            alert('Please enter your mobile number.');
            return;
        }

        // Basic mobile number validation (optional, can be more robust)
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

        switch (methodValue) {
            case 'cod':
                confirmationMessage = 'Your order has been placed successfully!\nPayment will be collected on delivery.';
                break;
            case 'card':
                // Basic front-end validation for card fields (not secure for real transactions)
                const cardNumber = cardDetailsDiv.querySelector('input[placeholder="Card Number"]').value.trim();
                const expiry = cardDetailsDiv.querySelector('input[placeholder="MM/YY"]').value.trim();
                const cvv = cardDetailsDiv.querySelector('input[placeholder="CVV"]').value.trim();
                const cardHolderName = cardDetailsDiv.querySelector('input[placeholder="Card Holder Name"]').value.trim();

                if (!cardNumber || !expiry || !cvv || !cardHolderName) {
                    alert('Please fill in all card details.');
                    return;
                }
                // In a real application, this would send data to a payment gateway API
                confirmationMessage = 'Card payment simulated. Your order has been placed successfully!';
                break;
            case 'upi':
                const upiId = upiDetailsDiv.querySelector('input[placeholder="Your UPI ID (e.g., example@bank)"]').value.trim();
                if (!upiId) {
                    alert('Please enter your UPI ID.');
                    return;
                }
                // Basic UPI ID format check (optional, can be more robust)
                if (!upiId.includes('@')) {
                    alert('Please enter a valid UPI ID (e.g., name@bank).');
                    return;
                }
                // In a real application, this would initiate a UPI payment request
                confirmationMessage = `UPI payment request simulated for ${upiId}. Your order will be confirmed upon successful payment.`;
                break;
            default:
                confirmationMessage = 'An unknown payment method was selected.';
                alert(confirmationMessage);
                return;
        }

        alert(confirmationMessage); // Use alert for demonstration
        cart = []; // Clear cart after "checkout"
        updateCartUI(); // Update UI
        toggleCart(); // Close cart sidebar
        addressInput.value = ''; // Clear address
        mobileInput.value = ''; // Clear mobile
    });

    // --- Payment Method Selection Logic ---
    /**
     * Shows or hides payment detail forms based on the selected radio button.
     */
    function showPaymentDetails() {
        // Hide all payment detail divs first
        cardDetailsDiv.classList.add('hidden');
        upiDetailsDiv.classList.add('hidden');

        // Show the relevant div based on the checked radio button
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked');
        if (selectedMethod) { // Check if any method is selected
            if (selectedMethod.value === 'card') {
                cardDetailsDiv.classList.remove('hidden');
            } else if (selectedMethod.value === 'upi') {
                upiDetailsDiv.classList.remove('hidden');
            }
        }
    }

    // Add change listeners to all payment method radio buttons
    paymentMethods.forEach(radio => {
        radio.addEventListener('change', showPaymentDetails);
    });

    // Initialize payment details display on page load
    showPaymentDetails();


    // --- Product Image Slider Functionality ---
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const imageContainer = card.querySelector('.product-image-container');

        // Only initialize slider if an image container exists for the card
        // and it's not a 'coming-soon' card (which might not have full slider elements)
        if (imageContainer && !card.classList.contains('coming-soon')) {
            const images = imageContainer.querySelectorAll('.product-image');
            const prevBtn = imageContainer.querySelector('.prev-btn');
            const nextBtn = imageContainer.querySelector('.next-btn');
            let currentImageIndex = 0;

            // Ensure there are images to slide and buttons exist
            if (images.length > 0 && prevBtn && nextBtn) {
                /**
                 * Displays the image at the given index and hides others.
                 * @param {number} index - The index of the image to show.
                 */
                function showImage(index) {
                    // Optimized: Hide previous active image, show new one
                    const prevActiveImage = imageContainer.querySelector('.product-image.active');
                    if (prevActiveImage) {
                        prevActiveImage.classList.remove('active');
                    }
                    images[index].classList.add('active');
                }

                prevBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevents card click event if any
                    currentImageIndex = (currentImageIndex > 0) ? currentImageIndex - 1 : images.length - 1;
                    showImage(currentImageIndex);
                });

                nextBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentImageIndex = (currentImageIndex < images.length - 1) ? currentImageIndex + 1 : 0;
                    showImage(currentImageIndex);
                });

                // Initialize: show the first image when the page loads
                showImage(0);
            }
        }
    });

    // Initial cart UI update (in case items are loaded from localStorage later)
    updateCartUI();
});

// --- Global Toggle Cart Sidebar Visibility ---
// This function is kept global because it might be triggered by elements
// outside the main DOMContentLoaded scope (e.g., a cart icon in the header).
function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    cartSidebar.classList.toggle('open');
    cartOverlay.classList.toggle('open');
}