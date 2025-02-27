// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc, // Added getDoc for single document fetch
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOLeCcUeQs5nAUAVZUlGgJ8pNRzSYQsgM",
  authDomain: "rms-db-2d39e.firebaseapp.com",
  projectId: "rms-db-2d39e",
  storageBucket: "rms-db-2d39e.appspot.com",
  messagingSenderId: "644609555310",
  appId: "1:644609555310:web:cb33f8378bd3a1c1f95f7f",
  measurementId: "G-VLN9N97ESW",
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
  document.querySelectorAll(".delete-btn").forEach((button) => {
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

// Function to Add a Pending Patient
export async function addPendingPatient(patientID, name, condition, roomAssigned, priorityLevel) {
  try {
    await addDoc(collection(db, "pendingPatients"), {
      patientID,
      name,
      condition,
      roomAssigned,
      priorityLevel,
      timestamp: serverTimestamp(), 
    });
    console.log(`✅ Pending Patient ${name} added successfully!`);
    loadPendingPatients(); // Refresh table after adding
  } catch (error) {
    console.error("❌ Error adding pending patient:", error);
  }
}

// Function to Load Pending Patients
export async function loadPendingPatients() {
  const tableBody = document.getElementById("pending-patients-table-body");
  tableBody.innerHTML = ""; // Clear existing rows

  const querySnapshot = await getDocs(collection(db, "pendingPatients"));

  // Convert querySnapshot to an array of rows
  const rows = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    rows.push({
      id: docSnap.id, // Firestore document ID
      ...data, // Spread the data (patientID, name, condition, roomAssigned, priorityLevel, timestamp)
    });
  });

  // Sort rows:
  // 1. "Urgent" first, then "Regular"
  // 2. Within each priority level, sort by timestamp (descending order: newest first)
  rows.sort((a, b) => {
    // Sort by priority level
    if (a.priorityLevel === "Urgent" && b.priorityLevel !== "Urgent") return -1; // a comes first
    if (a.priorityLevel !== "Urgent" && b.priorityLevel === "Urgent") return 1; // b comes first

    // If priority levels are the same, sort by timestamp (descending order)
    const timestampA = a.timestamp?.toDate().getTime() || 0; // Convert Firestore timestamp to milliseconds
    const timestampB = b.timestamp?.toDate().getTime() || 0;
    return timestampA - timestampB; // Newest last
  });

  // Append sorted rows to the table
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${row.patientID}</td>
        <td>${row.name}</td>
        <td>${row.condition}</td>
        <td>${row.roomAssigned}</td>
        <td>${row.priorityLevel}</td>
        <td>
          <button class="delete-btn" data-id="${row.id}">Delete</button>
          <button class="confirm-btn" data-id="${row.id}">Confirm</button>
        </td>
      `;
    tableBody.appendChild(tr);
  });

  // Attach event listeners to delete buttons
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const patientID = this.getAttribute("data-id");
      await deletePendingPatient(patientID);
    });
  });

  // Attach event listeners to confirm buttons
  document.querySelectorAll(".confirm-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const patientID = this.getAttribute("data-id");
      await confirmPendingPatient(patientID);
    });
  });
}

// Function to Delete a Pending Patient
export async function deletePendingPatient(patientID) {
  try {
    await deleteDoc(doc(db, "pendingPatients", patientID));
    console.log(`🗑️ Pending Patient deleted: ${patientID}`);
    loadPendingPatients(); // Refresh table after deletion
  } catch (error) {
    console.error("❌ Error deleting pending patient:", error);
  }
}

// Function to Confirm a Pending Patient
export async function confirmPendingPatient(patientID) {
  try {
    const patientDoc = await getDoc(doc(db, "pendingPatients", patientID));
    const patientData = patientDoc.data();

    await addDoc(collection(db, "activePatients"), {
      patientID: patientData.patientID,
      name: patientData.name,
      condition: patientData.condition,
      roomAssigned: patientData.roomAssigned,
      timestamp: serverTimestamp(),
      status: "In Progress",
    });

    await deletePendingPatient(patientID);
    loadActivePatients();
    // loadPendingPatients();
  } catch (error) {
    console.error("❌ Error confirming patient:", error);
  }
}

// Function to Load Active Patients
export async function loadActivePatients() {
  const tableBody = document.getElementById("active-patients-table-body");
  tableBody.innerHTML = ""; // Clear existing rows

  const querySnapshot = await getDocs(collection(db, "activePatients"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${data.patientID}</td>
            <td>${data.name}</td>
            <td>${data.condition}</td>
            <td>${data.roomAssigned}</td>
            <td>${new Date(data.timestamp?.toDate()).toLocaleString()}</td>
            <td>${data.status}</td>
            <td>
                <button class="complete-btn" data-id="${docSnap.id}">Mark as Completed</button>
            </td>
        `;

    tableBody.appendChild(row);
  });

  // Attach event listeners to complete buttons
  document.querySelectorAll(".complete-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const patientID = this.getAttribute("data-id");
      await markPatientAsCompleted(patientID);
    });
  });
}

// Function to Mark as Completed
export async function markPatientAsCompleted(patientID) {
  try {
    const patientDoc = await getDoc(doc(db, "activePatients", patientID)); // FIX: getDoc
    const patientData = patientDoc.data();

    await addDoc(collection(db, "usageLog"), {
      patientID: patientData.patientID,
      name: patientData.name,
      condition: patientData.condition,
      roomAssigned: patientData.roomAssigned,
      timestamp: serverTimestamp(),
      status: "Completed",
    });

    await deleteDoc(doc(db, "activePatients", patientID));
    loadActivePatients();
  } catch (error) {
    console.error("❌ Error marking patient as completed:", error);
  }
}

// Function to Load Usage Log
export async function loadUsageLog() {
  const tableBody = document.getElementById("usage-log-table-body");
  tableBody.innerHTML = ""; // Clear existing rows

  const querySnapshot = await getDocs(collection(db, "usageLog"));

  // Convert querySnapshot to an array of rows
  const rows = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    rows.push({
      id: docSnap.id, // Firestore document ID
      ...data, // Spread the data (patientID, name, condition, roomAssigned, timestamp, status)
    });
  });

  // Sort rows by timestamp (ascending order: least recent to most recent)
  rows.sort((a, b) => {
    const timestampA = a.timestamp?.toDate().getTime() || 0; // Convert Firestore timestamp to milliseconds
    const timestampB = b.timestamp?.toDate().getTime() || 0;
    return timestampA - timestampB; // Sort in ascending order
  });

  // Append sorted rows to the table
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${row.patientID}</td>
        <td>${row.name}</td>
        <td>${row.condition}</td>
        <td>${row.roomAssigned}</td>
        <td>${new Date(row.timestamp?.toDate()).toLocaleString()}</td>
        <td>${row.status}</td>
      `;
    tableBody.appendChild(tr);
  });
}

// Load Available Resources
export async function loadAvailableResources() {
  const tableBody = document.getElementById("available-resources-table-body");
  tableBody.innerHTML = ""; // Clear existing rows

  const querySnapshot = await getDocs(collection(db, "availableResources"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${data.resource}</td>
        <td>${data.available}</td>
        <td>
          <button class="delete-btn" data-id="${docSnap.id}">Remove</button>
        </td>
      `;

    tableBody.appendChild(row);
  });

  // Attach event listeners to delete buttons
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const resourceID = this.getAttribute("data-id");
      await deleteDoc(doc(db, "availableResources", resourceID));
      loadAvailableResources(); // Refresh table
      updateAvailableBeds();
    });
  });

  updateAvailableBeds();
}

// Load Ward Beds Usage
export async function loadWardBedsUsage() {
  const tableBody = document.getElementById("ward-beds-usage-table-body");
  tableBody.innerHTML = ""; // Clear existing rows

  const activePatientsSnapshot = await getDocs(collection(db, "activePatients"));
  const staffSnapshot = await getDocs(collection(db, "staff"));

  const staffList = [];
  staffSnapshot.forEach((docSnap) => {
    staffList.push(docSnap.data().name);
  });

  let staffIndex = 0;

  activePatientsSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.roomAssigned.toLowerCase().includes("ward")) {
      const row = document.createElement("tr");

      row.innerHTML = `
          <td>${new Date(data.timestamp?.toDate()).toLocaleString()}</td>
          <td>${data.patientID}</td>
          <td>${staffList[staffIndex % staffList.length]}</td>
        `;

      tableBody.appendChild(row);
      staffIndex++;
    }
  });

  // Update available beds count
  updateAvailableBeds();
}

// Update Available Beds
export async function updateAvailableBeds() {
  const availableBedsSpan = document.getElementById("available-beds");

  const availableResourcesSnapshot = await getDocs(collection(db, "availableResources"));
  let totalBeds = 0;

  availableResourcesSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.resource.toLowerCase().includes("beds in wards")) {
      totalBeds = parseInt(data.available, 10);
    }
  });

  const wardBedsUsageSnapshot = await getDocs(collection(db, "activePatients"));
  let usedBeds = 0;

  wardBedsUsageSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.roomAssigned.toLowerCase().includes("ward")) {
      usedBeds++;
    }
  });

  availableBedsSpan.textContent = Math.max(totalBeds - usedBeds, 0);
}

// Load Oxygen Cylinder Stocking
export async function loadOxygenStocking() {
  const tableBody = document.getElementById("oxygen-stocking-table-body");
  tableBody.innerHTML = ""; // Clear existing rows

  const querySnapshot = await getDocs(collection(db, "oxygenStocking"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${new Date(data.timestamp?.toDate()).toLocaleString()}</td>
        <td>${data.amountAdded}</td>
        <td>
          <button class="delete-btn" data-id="${docSnap.id}">Delete</button>
        </td>
      `;

    tableBody.appendChild(row);
  });

  // Attach event listeners to delete buttons
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const stockingID = this.getAttribute("data-id");
      await deleteDoc(doc(db, "oxygenStocking", stockingID));
      loadOxygenStocking(); // Refresh table
    });
  });

  // Update available cylinders count
  updateAvailableCylinders();
}

// Load Oxygen Cylinder Usage
export async function loadOxygenUsage() {
  const tableBody = document.getElementById("oxygen-usage-table-body");
  tableBody.innerHTML = ""; // Clear existing rows

  const querySnapshot = await getDocs(collection(db, "oxygenUsage"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${new Date(data.timestamp?.toDate()).toLocaleString()}</td>
        <td>${data.patientID}</td>
        <td>
          <button class="delete-btn" data-id="${docSnap.id}">Delete</button>
        </td>
      `;

    tableBody.appendChild(row);
  });

  // Attach event listeners to delete buttons
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const usageID = this.getAttribute("data-id");
      await deleteDoc(doc(db, "oxygenUsage", usageID));
      loadOxygenUsage(); // Refresh table
    });
  });

  // Update available cylinders count
  updateAvailableCylinders();
}

// Update Available Cylinders
export async function updateAvailableCylinders() {
  const availableCylindersSpan = document.getElementById("available-cylinders");

  const stockingSnapshot = await getDocs(collection(db, "oxygenStocking"));
  let totalCylinders = 0;

  stockingSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    totalCylinders += parseInt(data.amountAdded, 10);
  });

  const usageSnapshot = await getDocs(collection(db, "oxygenUsage"));
  const usedCylinders = usageSnapshot.size;

  availableCylindersSpan.textContent = Math.max(totalCylinders - usedCylinders, 0);
}

// Add Available Resource
export async function addAvailableResource(resource, available) {
  try {
    await addDoc(collection(db, "availableResources"), {
      resource,
      available: parseInt(available, 10),
    });
    loadAvailableResources(); // Refresh table
  } catch (error) {
    console.error("❌ Error adding resource:", error);
  }
}

// Add Oxygen Stocking
export async function addOxygenStocking(amountAdded) {
  try {
    await addDoc(collection(db, "oxygenStocking"), {
      amountAdded: parseInt(amountAdded, 10),
      timestamp: serverTimestamp(),
    });
    loadOxygenStocking(); // Refresh table
  } catch (error) {
    console.error("❌ Error adding oxygen stocking:", error);
  }
}

// Add Oxygen Usage
export async function addOxygenUsage(patientID) {
  try {
    await addDoc(collection(db, "oxygenUsage"), {
      patientID,
      timestamp: serverTimestamp(),
    });
    loadOxygenUsage(); // Refresh table
  } catch (error) {
    console.error("❌ Error adding oxygen usage:", error);
  }
}

// Helper function to check if a timestamp is within the last 7 days
function isWithinLast7Days(timestamp) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    return timestamp.toDate() >= sevenDaysAgo;
  }
  
  // Function to count Patients Attended (from activePatients and usageLog within last 7 days)
  export async function countPatientsAttended() {
    const activePatientsSnapshot = await getDocs(collection(db, "activePatients"));
    const usageLogSnapshot = await getDocs(collection(db, "usageLog"));
    let count = 0;
  
    // Count active patients within last 7 days
    activePatientsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.timestamp && isWithinLast7Days(data.timestamp)) {
        count++;
      }
    });
  
    // Count usage log entries within last 7 days
    usageLogSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.timestamp && isWithinLast7Days(data.timestamp)) {
        count++;
      }
    });
  
    return count;
  }
  
  // Function to count Oxygen Cylinders used (from oxygenUsage within last 7 days)
  export async function countOxygenCylinders() {
    const querySnapshot = await getDocs(collection(db, "oxygenUsage"));
    let count = 0;
  
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.timestamp && isWithinLast7Days(data.timestamp)) {
        count++;
      }
    });
  
    return count;
  }
  
  // Function to count Beds in Wards (from activePatients and usageLog)
  export async function countBedsInWards() {
    const activePatientsSnapshot = await getDocs(collection(db, "activePatients"));
    const usageLogSnapshot = await getDocs(collection(db, "usageLog"));
    let count = 0;
  
    // Check activePatients
    activePatientsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.roomAssigned && data.roomAssigned.toLowerCase().includes("ward")) {
        count++;
      }
    });
  
    // Check usageLog
    usageLogSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.roomAssigned && data.roomAssigned.toLowerCase().includes("ward")) {
        count++;
      }
    });
  
    return count;
  }
  
  // Function to count X-Ray cases (from activePatients and usageLog within last 7 days)
  export async function countXRayCases() {
    const activePatientsSnapshot = await getDocs(collection(db, "activePatients"));
    const usageLogSnapshot = await getDocs(collection(db, "usageLog"));
    let count = 0;
  
    // Check activePatients within last 7 days
    activePatientsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        data.roomAssigned &&
        data.roomAssigned.toLowerCase().includes("x-ray") &&
        data.timestamp &&
        isWithinLast7Days(data.timestamp)
      ) {
        count++;
      }
    });
  
    // Check usageLog within last 7 days
    usageLogSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        data.roomAssigned &&
        data.roomAssigned.toLowerCase().includes("x-ray") &&
        data.timestamp &&
        isWithinLast7Days(data.timestamp)
      ) {
        count++;
      }
    });
  
    return count;
  }
  
  // Function to count MRI Scans (from activePatients and usageLog within last 7 days)
  export async function countMRIScans() {
    const activePatientsSnapshot = await getDocs(collection(db, "activePatients"));
    const usageLogSnapshot = await getDocs(collection(db, "usageLog"));
    let count = 0;
  
    // Check activePatients within last 7 days
    activePatientsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        data.roomAssigned &&
        data.roomAssigned.toLowerCase().includes("mri scan") &&
        data.timestamp &&
        isWithinLast7Days(data.timestamp)
      ) {
        count++;
      }
    });
  
    // Check usageLog within last 7 days
    usageLogSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        data.roomAssigned &&
        data.roomAssigned.toLowerCase().includes("mri scan") &&
        data.timestamp &&
        isWithinLast7Days(data.timestamp)
      ) {
        count++;
      }
    });
  
    return count;
  }
  
  // Function to count CT Scans (from activePatients and usageLog within last 7 days)
  export async function countCTScans() {
    const activePatientsSnapshot = await getDocs(collection(db, "activePatients"));
    const usageLogSnapshot = await getDocs(collection(db, "usageLog"));
    let count = 0;
  
    // Check activePatients within last 7 days
    activePatientsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        data.roomAssigned &&
        data.roomAssigned.toLowerCase().includes("ct scan") &&
        data.timestamp &&
        isWithinLast7Days(data.timestamp)
      ) {
        count++;
      }
    });
  
    // Check usageLog within last 7 days
    usageLogSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        data.roomAssigned &&
        data.roomAssigned.toLowerCase().includes("ct scan") &&
        data.timestamp &&
        isWithinLast7Days(data.timestamp)
      ) {
        count++;
      }
    });
  
    return count;
  }