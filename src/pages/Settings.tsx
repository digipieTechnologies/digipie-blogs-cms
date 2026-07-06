import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Camera,
  Loader2,
  KeyRound,
  User,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/contexts/ThemeContext";

export function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile state
  const [name, setName] = useState("Admin User");
  const [avatar, setAvatar] = useState("https://i.pravatar.cc/150?u=admin");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loading state
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAvatar(profile.avatar_url || "https://i.pravatar.cc/150?u=admin");
    }
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      setSelectedFile(file);
      setAvatar(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setIsSavingProfile(true);
    try {
      let avatarUrl = avatar;

      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        let filePath = "";

        if (profile?.avatar_url) {
          // If avatar already exists, extract the file name from URL to overwrite/update in-place
          // Strip any query strings/cache-busters first
          const cleanAvatarUrl = profile.avatar_url.split("?")[0];
          const parts = cleanAvatarUrl.split("users/");
          filePath =
            parts.length > 1 ? parts[1] : `avatar-${user.id}.${fileExt}`;
        } else {
          filePath = `avatar-${user.id}.${fileExt}`;
        }

        const { error: uploadError } = await supabase.storage
          .from("users")
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from("users").getPublicUrl(filePath);
        const cleanUrl = data.publicUrl.split("?")[0];
        avatarUrl = `${cleanUrl}?t=${Date.now()}`;
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      await refreshProfile();
      setSelectedFile(null);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Password fields are required");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to change password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account profile, credentials, and preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card className="subtle-shadow bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Profile Settings
            </CardTitle>
            <CardDescription>
              Update your account display name and photo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-24 h-24 rounded-full border-2 border-border cursor-pointer overflow-hidden bg-muted hover:border-primary transition-all duration-300"
              >
                <img
                  src={avatar}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Camera className="h-5 w-5 mb-1" />
                  <span className="text-[10px] font-medium">Change Photo</span>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG or WEBP. Max 2MB.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>

            <Button
              onClick={handleSaveProfile}
              className="w-full gap-2"
              disabled={isSavingProfile}
            >
              {isSavingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="subtle-shadow bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Security
            </CardTitle>
            <CardDescription>
              Change your password to secure your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isSavingPassword}
              >
                {isSavingPassword && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Theme Settings Card */}
        <Card className="subtle-shadow bg-background/50 backdrop-blur-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-primary dark:hidden" />
              <Moon className="h-5 w-5 text-primary hidden dark:block" />
              Appearance Settings
            </CardTitle>
            <CardDescription>
              Customize the appearance of the application. Select your preferred
              color mode.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                  theme === "light"
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border hover:border-primary/50 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400">
                  <Sun className="h-6 w-6" />
                </div>
                <span className="font-medium text-sm">Light Mode</span>
              </button>

              <button
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                  theme === "dark"
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border hover:border-primary/50 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                  <Moon className="h-6 w-6" />
                </div>
                <span className="font-medium text-sm">Dark Mode</span>
              </button>

              <button
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                  theme === "system"
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border hover:border-primary/50 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300">
                  <Monitor className="h-6 w-6" />
                </div>
                <span className="font-medium text-sm">System</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
