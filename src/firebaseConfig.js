// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyDKtLEVtoxEUhLep9Md6RWzYkqPAZ8tzfY",
//   authDomain: "ai-course-generator-13d59.firebaseapp.com",
//   projectId: "ai-course-generator-13d59",
//   storageBucket: "ai-course-generator-13d59.firebasestorage.app",
//   messagingSenderId: "793496733807",
//   appId: "1:793496733807:web:c0a51e0ca4d3d7043c659a",
//   measurementId: "G-0BHHLHVE7X"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// // src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Replace these placeholders with your actual Firebase project config 
const firebaseConfig = {
    apiKey: "AIzaSyDKtLEVtoxEUhLep9Md6RWzYkqPAZ8tzfY", 
    authDomain: "ai-course-generator-13d59.firebaseapp.com",
    projectId: "ai-course-generator-13d59",
    // ... rest of config
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Assign the result of getAuth(app) to a local constant

// 💡 Ensure 'auth' is exported using a NAMED EXPORT:
export { auth }; 

// If you want to export more:
// export const appInstance = app;