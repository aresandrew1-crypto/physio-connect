
const bookingForm = document.getElementById("bookingForm");
const physioForm = document.getElementById("physioForm");
const dateInput = document.getElementById("date");

// Prevent choosing a date in the past.
const today = new Date();
const localDate = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0")
].join("-");

dateInput.min = localDate;

bookingForm.addEventListener("submit", function(event) {
  event.preventDefault();

  document.getElementById("bookingMessage").textContent =
    "Demo successful! No real appointment was booked.";

  bookingForm.reset();
});

physioForm.addEventListener("submit", function(event) {
  event.preventDefault();

  document.getElementById("physioMessage").textContent =
    
// STEP 7: Supabase patient authentication

const SUPABASE_URL =https://aresandrew1-crypto.github.io/physio-connect/
  "https://YOUR-PROJECT-ID.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =sb_publishable_D1k4zY9ksL3zcKLvxKJXhQ_xegvitGn
  "YOUR-SUPABASE-PUBLISHABLE-KEY";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const authForms = document.getElementById("authForms");
const dashboard = document.getElementById("patientDashboard");
const authMessage = document.getElementById("authMessage");

function showMessage(message) {
  authMessage.textContent = message;
}

// REGISTER A NEW PATIENT

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("signupName")
    .value.trim();
  const area = document.getElementById("signupArea")
    .value.trim();
  const email = document.getElementById("signupEmail")
    .value.trim();
  const password = document.getElementById("signupPassword")
    .value;

  showMessage("Creating account...");

  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin +
        window.location.pathname,
      data: {
        full_name: name,
        service_area: area,
        account_type: "patient"
      }
    }
  });

  if (error) {
    showMessage(error.message);
    return;
  }

  signupForm.reset();

  if (!data.session) {
    showMessage(
      "Check your email for a confirmation link. " +
      "After confirming, return here and log in."
    );
  } else {
    await loadPatientDashboard();
  }
});

// LOGIN

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password =
    document.getElementById("loginPassword").value;

  showMessage("Signing in...");

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showMessage(error.message);
    return;
  }

  loginForm.reset();
  await loadPatientDashboard();
});

// CREATE OR LOAD THE PATIENT PROFILE

async function loadPatientDashboard() {
  const { data: { user }, error: userError } =
    await db.auth.getUser();

  if (userError || !user) {
    authForms.hidden = false;
    dashboard.hidden = true;
    return;
  }

  // Profile information comes from signup metadata.
  // The database enforces that users can only
  // create their own patient profile.

  const metadata = user.user_metadata || {};

  if (metadata.account_type !== "patient") {
    await db.auth.signOut();
    showMessage("This is not a patient account.");
    return;
  }

  let { data: profile, error } = await db
    .from("patient_profiles")
    .select("full_name, service_area")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!error && !profile) {
    const result = await db
      .from("patient_profiles")
      .insert({
        user_id: user.id,
        full_name: metadata.full_name,
        service_area: metadata.service_area
      });

    error = result.error;

    if (!error) {
      profile = {
        full_name: metadata.full_name,
        service_area: metadata.service_area
      };
    }
  }

  if (error || !profile) {
    showMessage(
      "Signed in, but your profile could not be loaded. " +
      (error ? error.message : "Please contact support.")
    );
    return;
  }

  document.getElementById("welcomePatient")
    .textContent = "Welcome, " + profile.full_name;

  document.getElementById("patientArea")
    .textContent = "Service area: " + profile.service_area;

  authForms.hidden = true;
  dashboard.hidden = false;
  showMessage("You are signed in.");
}

// LOGOUT

document.getElementById("logoutButton")
  .addEventListener("click", async () => {
    const { error } = await db.auth.signOut();

    if (error) {
      showMessage(error.message);
      return;
    }

    dashboard.hidden = true;
    authForms.hidden = false;
    showMessage("You have logged out.");
  });

// CHECK EXISTING LOGIN ON PAGE LOAD

loadPatientDashboard();

    "Demo successful! No registration was submitted.";

  physioForm.reset();
});
