
const STORAGE_KEY = "archpilot-user";

export const loginWithGoogle = () => {
  loginAsDemoUser("Google Demo");
};

export const loginWithGitHub = () => {
  loginAsDemoUser("GitHub Demo");
};

function loginAsDemoUser(provider) {
  const demoUser = {
    id: "demo-user-001",
    fullName: "ArchPilot Developer",
    userName: "developer",
    email: "developer@archpilot.local",
    avatarUrl: "",
    provider,
    role: "USER",
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));

  window.location.assign("/dashboard");
}

export const getCurrentUser = async () => {
  const storedUser = localStorage.getItem(STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};
