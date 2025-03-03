document.addEventListener("DOMContentLoaded", function () {
  const submitWithdrawBtn = document.getElementById("submit-withdraw");
  const withdrawAmountInput = document.getElementById("withdraw-amount");

  const firebaseConfig = {
    apiKey: "AIzaSyDSWMPmzwyRoJf6ymBA56sqEu0hZRPXAFA",
    authDomain: "dorochat-830bb.firebaseapp.com",
    databaseURL: "https://dorochat-830bb-default-rtdb.firebaseio.com",
    projectId: "dorochat-830bb",
    storageBucket: "dorochat-830bb.firebasestorage.app",
    messagingSenderId: "390410096076",
    appId: "1:390410096076:web:ef0cb4978c93b6be96a169",
  };

  firebase.initializeApp(firebaseConfig);

  // Elements
  const loginSection = document.getElementById("login-section");
  const detailsSection = document.getElementById("details-section");
  const adminPanel = document.getElementById("admin-panel");
  const googleLoginBtn = document.getElementById("google-login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const userName = document.getElementById("user-name");
  const userEmail = document.getElementById("user-email");
  const incomeList = document.getElementById("income-list");

  document
    .getElementById("withdraw-btn")
    .addEventListener("click", function () {
      window.location.href = "withdraw.html";
    });

  // Monitor auth state
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      showUserDetails(user);

      // Save user information without overwriting existing data
      const userRef = firebase.database().ref("users/" + user.uid);
      userRef.once("value", (snapshot) => {
        if (!snapshot.exists()) {
          // User data doesn't exist, so set it with the initial data (without income)
          userRef.set({
            email: user.email,
            name: user.displayName,
            profilePic: user.photoURL,
            isAuthenticated: true, // To track if the user has been authenticated
            // Don't set income here, leave it unset
          });
        }

        // Store the income in localStorage if it exists
        const userData = snapshot.val();
        if (userData.income) {
          localStorage.setItem("income", userData.income);
        }
      });

      // Admin-only logic
      if (user.email === "adahadd4845e@gmail.com") {
        adminPanel.classList.remove("hidden");
      } else {
        adminPanel.classList.add("hidden");
      }
    } else {
      loginSection.classList.remove("hidden");
      detailsSection.classList.add("hidden");
      adminPanel.classList.add("hidden");
    }
  });

  // Google login
  googleLoginBtn.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
        const user = result.user;
        // Store user data in Firebase
        const userRef = firebase.database().ref("users/" + user.uid);
        userRef.set({
          email: user.email,
          name: user.displayName,
          profilePic: user.photoURL,
          isAuthenticated: true, // Save user's authentication status
        });

        showUserDetails(user);
      })
      .catch((error) => console.error(error.message));
  });

  // Logout
  logoutBtn.addEventListener("click", () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        loginSection.classList.remove("hidden");
        detailsSection.classList.add("hidden");
        adminPanel.classList.add("hidden");
      });
  });

  // Validate withdrawal amount
  submitWithdrawBtn.addEventListener("click", async () => {
    const withdrawAmount = parseInt(withdrawAmountInput.value);
    const income = localStorage.getItem("income"); // Get income from localStorage

    if (income) {
      // Ensure the withdraw amount is at least 200 less than the income
      if (withdrawAmount >= income || withdrawAmount < income - 200) {
        alert(
          "Invalid withdrawal amount! Must be at least 200 less than your income."
        );
        return;
      }

      // Continue with the withdrawal logic...
      alert("Withdrawal successful!"); // You can add your withdrawal logic here
    } else {
      alert("No income found in local storage.");
    }
  });

  // Show user details
  function showUserDetails(user) {
    loginSection.classList.add("hidden");
    detailsSection.classList.remove("hidden");
    userName.textContent = user.displayName;
    userEmail.textContent = user.email;
    document.getElementById("profile-pic").src = user.photoURL;
    fetchIncomeDetails(user.uid);
  }

  // Fetch and display the income details
  function fetchIncomeDetails(userId) {
    const dbRef = firebase.database().ref(`users/${userId}`);
    dbRef.once("value", (snapshot) => {
      if (snapshot.exists()) {
        const user = snapshot.val();
        const income = user.income; // Access the income field
        if (income) {
          incomeList.innerHTML = `<li>This month's Income: ${income} Taka</li>`;
          // Display the income
        } else {
          incomeList.innerHTML = "<li>No income details found.</li>";
        }
      } else {
        incomeList.innerHTML = "<li>No income details found.</li>";
      }
    });
  }

  // Fetch all users for the admin panel
  function fetchUsers() {
    const dbRef = firebase.database().ref("users"); // Make sure this path matches your Firebase data structure
    dbRef.once("value", (snapshot) => {
      if (snapshot.exists()) {
        userListContainer.innerHTML = ""; // Clear previous list

        snapshot.forEach((childSnapshot) => {
          const user = childSnapshot.val();

          // Add user info to the list for admin panel
          const userCard = document.createElement("div");
          userCard.classList.add(
            "user-card",
            "p-4",
            "bg-white",
            "shadow-md",
            "rounded-lg",
            "mb-4",
            "flex",
            "items-center"
          );

          const userImg = document.createElement("img");
          userImg.src = user.profilePic;
          userImg.alt = user.name;
          userImg.classList.add("w-16", "h-16", "rounded-full", "mr-4");

          const userInfo = document.createElement("div");
          const userName = document.createElement("h4");
          userName.classList.add("text-lg", "font-bold");
          userName.textContent = user.name;

          const userEmail = document.createElement("p");
          userEmail.classList.add("text-sm", "text-gray-500");
          userEmail.textContent = user.email;

          userInfo.appendChild(userName);
          userInfo.appendChild(userEmail);
          userCard.appendChild(userImg);
          userCard.appendChild(userInfo);

          userListContainer.appendChild(userCard);
        });
      }
    });
  }

  // Set income details for employee
  // Update income details for a user
  setIncomeBtn.addEventListener("click", () => {
    const employeeEmail = emailInput.value.trim(); // Get email from input
    const incomeDetails = incomeDetailsInput.value.trim(); // Get income details input

    if (!employeeEmail || !incomeDetails) {
      alert("Please enter an email address and income value.");
      return;
    }

    // Admin logic to set income
    if (firebase.auth().currentUser.email !== "adahadd4845e@gmail.com") {
      alert("You are not authorized to update income details.");
      return;
    }

    // Find user by email and set income details
    firebase
      .auth()
      .fetchSignInMethodsForEmail(employeeEmail)
      .then((methods) => {
        if (methods.length > 0) {
          // User exists, now set income details
          const dbRef = firebase.database().ref("users");
          dbRef.once("value", (snapshot) => {
            snapshot.forEach((childSnapshot) => {
              const user = childSnapshot.val();
              if (user.email === employeeEmail) {
                user.income = incomeDetails; // Update the income

                // Update the database with new income
                dbRef
                  .child(childSnapshot.key)
                  .update({ income: incomeDetails })
                  .then(() => {
                    alert("Income details updated successfully.");
                    incomeDetailsInput.value = ""; // Clear input
                  });
              }
            });
          });
        } else {
          alert("User not found with that email address.");
        }
      });
  });
});
