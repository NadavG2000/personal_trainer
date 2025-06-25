// You can fill in real logic later
export const User = {
  me: async () => ({ email: "demo@example.com" }),
};

export const UserProfile = {
  filter: async ({ created_by }) => [],
  create: async (data) => console.log("Creating profile", data),
  update: async (id, data) => console.log("Updating profile", id, data),
};
