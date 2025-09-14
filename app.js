import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const loginBox = document.getElementById("login-box");
const dashboard = document.getElementById("dashboard");
const userEmailSpan = document.getElementById("user-email");
const adminSection = document.getElementById("admin-section");
const deliveryList = document.getElementById("delivery-list");
const studentEmailSelect = document.getElementById("studentEmailSelect");

// Admin credentials
const ADMIN_EMAIL = "gatekeeper@hostel.test";
const ADMIN_PASSWORD = "kishore";

// Track logged-in email
window.loggedInEmail = "";

// Sign Up (Students)
window.signup = async function() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  if(email === ADMIN_EMAIL){
    alert("Cannot sign up as admin.");
    return;
  }
  try {
    await createUserWithEmailAndPassword(window.auth, email, password);
    alert("Student account created! Now login.");
    await addUserToCollection(email);
  } catch (error) {
    alert(error.message);
  }
}

// Add student to users collection
async function addUserToCollection(email){
  const usersRef = collection(window.db, "users");
  await addDoc(usersRef, { email });
}

// Login
window.login = async function() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    if(email === ADMIN_EMAIL && password === ADMIN_PASSWORD){
      userEmailSpan.innerText = ADMIN_EMAIL;
      window.loggedInEmail = ADMIN_EMAIL;
      loginBox.style.display = "none";
      dashboard.style.display = "block";
      adminSection.style.display = "block";
      await loadStudents();
      await loadDeliveries();
    } else {
      await signInWithEmailAndPassword(window.auth, email, password);
      userEmailSpan.innerText = email;
      window.loggedInEmail = email;
      loginBox.style.display = "none";
      dashboard.style.display = "block";
      adminSection.style.display = "none";
      await loadStudentDeliveries(email);
    }
  } catch (error) {
    alert(error.message);
  }
}

// Logout
window.logout = async function() {
  await signOut(window.auth);
  loginBox.style.display = "block";
  dashboard.style.display = "none";
  adminSection.style.display = "none";
  deliveryList.innerHTML = "";
}

// Add Delivery (Admin)
window.addDelivery = async function() {
  const studentEmail = studentEmailSelect.value;
  const itemName = document.getElementById("itemName").value;
  const deliveryDate = document.getElementById("deliveryDate").value;

  if(!studentEmail || !itemName || !deliveryDate){
    alert("Please fill all fields");
    return;
  }

  try {
    await addDoc(collection(window.db, "deliveries"), {
      studentEmail,
      itemName,
      deliveryDate
    });
    alert("Delivery added successfully!");
    document.getElementById("itemName").value = "";
    document.getElementById("deliveryDate").value = "";
    await loadDeliveries();
  } catch(error){
    console.error("Error adding delivery:", error);
  }
}

// Delete Delivery
window.deleteDelivery = async function(deliveryId){
  if(!confirm("Are you sure you want to delete this delivery?")) return;

  try {
    await deleteDoc(doc(window.db, "deliveries", deliveryId));
    await refreshDeliveries();
  } catch(error){
    console.error("Error deleting delivery:", error);
  }
}

// Refresh list depending on user
async function refreshDeliveries(){
  if(window.loggedInEmail === ADMIN_EMAIL){
    await loadDeliveries();
  } else {
    await loadStudentDeliveries(window.loggedInEmail);
  }
}

// Load all deliveries (Admin)
async function loadDeliveries(){
  deliveryList.innerHTML = "";
  const querySnapshot = await getDocs(collection(window.db, "deliveries"));
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.textContent = `${data.studentEmail} - ${data.itemName} (${data.deliveryDate}) `;

    // Add delete button for admin
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.style.marginLeft = "10px";
    delBtn.onclick = () => deleteDelivery(docSnap.id);
    li.appendChild(delBtn);

    deliveryList.appendChild(li);
  });
}

// Load deliveries for a student
async function loadStudentDeliveries(studentEmail){
  deliveryList.innerHTML = "";
  const querySnapshot = await getDocs(collection(window.db, "deliveries"));
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    if(data.studentEmail === studentEmail){
      const li = document.createElement("li");
      li.textContent = `${data.itemName} (${data.deliveryDate}) `;

      // Student can delete their own deliveries
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.style.marginLeft = "10px";
      delBtn.onclick = () => deleteDelivery(docSnap.id);
      li.appendChild(delBtn);

      deliveryList.appendChild(li);
    }
  });
}

// Load all students for admin dropdown
async function loadStudents(){
  studentEmailSelect.innerHTML = '<option value="">Select Student</option>';
  const usersSnapshot = await getDocs(collection(window.db, "users"));
  usersSnapshot.forEach(docSnap => {
    const option = document.createElement("option");
    option.value = docSnap.data().email;
    option.textContent = docSnap.data().email;
    studentEmailSelect.appendChild(option);
  });
}

