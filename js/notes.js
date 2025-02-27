// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAOLeCcUeQs5nAUAVZUlGgJ8pNRzSYQsgM",
    authDomain: "rms-db-2d39e.firebaseapp.com",
    projectId: "rms-db-2d39e",
    storageBucket: "rms-db-2d39e.appspot.com",
    messagingSenderId: "644609555310",
    appId: "1:644609555310:web:cb33f8378bd3a1c1f95f7f",
    measurementId: "G-VLN9N97ESW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to Add a Staff Member
export async function addStaff(staffID, name) {
    try {
        await addDoc(collection(db, "staff"), { staffID, name });
        console.log(`✅ Staff ${name} added successfully!`);
        loadStaff(); // Refresh table after adding
    } catch (error) {
        console.error("❌ Error adding staff:", error);
    }
}

// Function to Retrieve and Display Staff in Table
export async function loadStaff() {
    const tableBody = document.getElementById("staff-table-body");
    tableBody.innerHTML = ""; // Clear existing rows

    const querySnapshot = await getDocs(collection(db, "staff"));
    querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${data.staffID}</td>
            <td>${data.name}</td>
            <td><button class="delete-btn" data-id="${docSnap.id}">Delete</button></td>
        `;

        tableBody.appendChild(row);
    });

    // Attach event listeners to delete buttons after rendering
    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", async function () {
            const staffID = this.getAttribute("data-id"); // Get Firestore document ID
            await deleteStaff(staffID);
        });
    });
}

// Function to Delete a Staff Member
export async function deleteStaff(staffID) {
    try {
        await deleteDoc(doc(db, "staff", staffID));
        console.log(`🗑️ Staff deleted: ${staffID}`);
        loadStaff(); // Refresh table after deletion
    } catch (error) {
        console.error("❌ Error deleting staff:", error);
    }
}
