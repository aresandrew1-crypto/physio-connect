
// ========================================
// PHYSIOCONNECT - SUPABASE CONNECTION
// ========================================

const SUPABASE_URL =https://aresandrew1-crypto.github.io/physio-connect/
  "https://YOUR-PROJECT-ID.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =sb_publishable_D1k4zY9ksL3zcKLvxKJXhQ_xegvitGn
  "YOUR-SUPABASE-PUBLISHABLE-KEY";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const el = (id) => document.getElementById(id);

function message(id, text) {
  el(id).textContent = text;
}

function redirectURL() {
  return window.location.origin +
    window.location.pathname;
}

// ========================================
// DEMO BOOKING FORM
// ========================================

const today = new Date();

el("date").min = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0")
].join("-");

el("bookingForm").addEventListener("submit", (event) => {
  event.preventDefault();

  message(
    "bookingMessage",
    "Demo successful! No real appointment was booked."
  );

  event.target.reset();
});

// ========================================
// PATIENT SIGNUP
// ========================================

el("signupForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  message("authMessage", "Creating account...");

  const { data, error } = await db.auth.signUp({
    email: el("signupEmail").value.trim(),
    password: el("signupPassword").value,
    options: {
      emailRedirectTo: redirectURL(),
      data: {
        account_type: "patient",
        full_name: el("signupName").value.trim(),
        service_area: el("signupArea").value.trim()
      }
    }
  });

  if (error) {
    message("authMessage", error.message);
    return;
  }

  event.target.reset();

  if (data.session) {
    await loadDashboard();
  } else {
    message(
      "authMessage",
      "Check your email to confirm your account."
    );
  }
});

// ========================================
// PHYSIOTHERAPIST SIGNUP
// ========================================

el("physioSignupForm").addEventListener(
  "submit", async (event) => {

    event.preventDefault();

    message(
      "physioAuthMessage",
      "Creating physiotherapist account..."
    );

    const { data, error } = await db.auth.signUp({
      email: el("physioEmail").value.trim(),
      password: el("physioPassword").value,
      options: {
        emailRedirectTo: redirectURL(),
        data: {
          account_type: "physiotherapist",
          full_name: el("physioName").value.trim(),
          qualification: el("qualification").value,
          service_area: el("physioCity").value.trim()
        }
      }
    });

    if (error) {
      message("physioAuthMessage", error.message);
      return;
    }

    event.target.reset();

    if (data.session) {
      await loadDashboard();
    } else {
      message(
        "physioAuthMessage",
        "Check your email to confirm your account. " +
        "Then log in to submit your application."
      );
    }
  }
);

// ========================================
// SHARED LOGIN FUNCTION
// ========================================

async function login(email, password, messageId) {

  message(messageId, "Signing in...");

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    message(messageId, error.message);
    return;
  }

  await loadDashboard();
}

el("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  await login(
    el("loginEmail").value.trim(),
    el("loginPassword").value,
    "authMessage"
  );

  event.target.reset();
});

el("physioLoginForm").addEventListener(
  "submit", async (event) => {

    event.preventDefault();

    await login(
      el("physioLoginEmail").value.trim(),
      el("physioLoginPassword").value,
      "physioAuthMessage"
    );

    event.target.reset();
  }
);

// ========================================
// DASHBOARD VISIBILITY
// ========================================

function showLoggedOut() {
  el("authForms").hidden = false;
  el("physioAuthForms").hidden = false;

  el("patientDashboard").hidden = true;
  el("physioDashboard").hidden = true;

  message("welcomePatient", "");
  message("patientArea", "");
  message("physioWelcome", "");
  message("physioQualification", "");
  message("physioArea", "");
  message("physioStatus", "");
  message("physioStatusMessage", "");
}

// ========================================
// ACCOUNT ROUTING
// ========================================

async function loadDashboard() {

  showLoggedOut();

  const { data: { user }, error } =
    await db.auth.getUser();

  if (error || !user) {
    return;
  }

  el("authForms").hidden = true;
  el("physioAuthForms").hidden = true;

  message("authMessage", "");
  message("physioAuthMessage", "");

  // Read existing database records first.
  // These queries are restricted by RLS.

  const patientResult = await db
    .from("patient_profiles")
    .select("full_name, service_area")
    .eq("user_id", user.id)
    .maybeSingle();

  const physioResult = await db
    .from("physiotherapist_applications")
    .select("full_name, qualification, service_area, verification_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (patientResult.error || physioResult.error) {
    await db.auth.signOut();
    showLoggedOut();
    message("authMessage", "Unable to load account.");
    return;
  }

  if (patientResult.data && physioResult.data) {
    await db.auth.signOut();
    showLoggedOut();
    message(
      "authMessage",
      "Multiple account profiles found. Contact support."
    );
    return;
  }

  if (patientResult.data) {
    displayPatient(patientResult.data);
    return;
  }

  if (physioResult.data) {
    displayPhysio(physioResult.data);
    return;
  }

  // Metadata is used only for initial onboarding.
  // It is NOT proof of professional eligibility
  // and does NOT grant administrator privileges.

  const metadata = user.user_metadata || {};

  if (metadata.account_type === "patient") {
    await createPatient(user, metadata);
  } else if (metadata.account_type === "physiotherapist") {
    await createPhysio(user, metadata);
  } else {
    await db.auth.signOut();
    showLoggedOut();
    message("authMessage", "Account type not recognized.");
  }
}

// ========================================
// CREATE PATIENT PROFILE
// ========================================

async function createPatient(user, metadata) {

  const { data, error } = await db
    .from("patient_profiles")
    .insert({
      user_id: user.id,
      full_name: metadata.full_name,
      service_area: metadata.service_area
    })
    .select("full_name, service_area")
    .single();

  if (error) {
    await db.auth.signOut();
    showLoggedOut();
    message("authMessage", error.message);
    return;
  }

  displayPatient(data);
}

function displayPatient(profile) {

  message(
    "welcomePatient",
    "Welcome, " + profile.full_name
  );

  message(
    "patientArea",
    "Service area: " + profile.service_area
  );

  el("patientDashboard").hidden = false;

  message("authMessage", "Patient signed in.");
}

// ========================================
// CREATE PHYSIOTHERAPIST APPLICATION
// ========================================

async function createPhysio(user, metadata) {

  const { data, error } = await db
    .from("physiotherapist_applications")
    .insert({
      user_id: user.id,
      full_name: metadata.full_name,
      qualification: metadata.qualification,
      service_area: metadata.service_area,
      verification_status: "pending"
    })
    .select(
      "full_name, qualification, service_area, verification_status"
    )
    .single();

  if (error) {
    await db.auth.signOut();
    showLoggedOut();
    message("physioAuthMessage", error.message);
    return;
  }

  displayPhysio(data);
}

// ========================================
// PHYSIOTHERAPIST DASHBOARD
// ========================================

function displayPhysio(profile) {

  message(
    "physioWelcome",
    "Welcome, " + profile.full_name
  );

  message(
    "physioQualification",
    "Qualification: " + profile.qualification
  );

  message(
    "physioArea",
    "Service area: " + profile.service_area
  );

  const status = profile.verification_status;

  message(
    "physioStatus",
    "Verification status: " + status.toUpperCase()
  );

  el("physioStatus").className = "status-" + status;

  if (status === "approved") {
    message(
      "physioStatusMessage",
      "Your application is approved. Booking features are coming soon."
    );
  } else if (status === "rejected") {
    message(
      "physioStatusMessage",
      "Your application was not approved. Contact support."
    );
  } else {
    message(
      "physioStatusMessage",
      "Your application is awaiting administrator review."
    );
  }

  el("physioDashboard").hidden = false;

  message("physioAuthMessage", "Physiotherapist signed in.");
}

// ========================================
// LOGOUT
// ========================================

async function logout() {

  const { error } = await db.auth.signOut();

  if (error) {
    message("authMessage", error.message);
    message("physioAuthMessage", error.message);
    return;
  }

  showLoggedOut();

  message("authMessage", "You have logged out.");
  message("physioAuthMessage", "You have logged out.");
}

el("logoutButton").addEventListener("click", logout);
el("physioLogout").addEventListener("click", logout);

el("physioRefresh").addEventListener(
  "click", loadDashboard
);

// Restore account after refreshing the page.
loadDashboard();
