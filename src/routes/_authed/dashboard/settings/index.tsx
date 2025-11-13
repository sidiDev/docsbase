import { createFileRoute } from "@tanstack/react-router";
import { useUser, useClerk } from "@clerk/clerk-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Check,
  Loader2,
  Upload,
  X,
  AlertTriangle,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/dashboard/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const convexUser = useQuery(
    api.users.getUserByExternalId,
    clerkUser?.id ? { externalId: clerkUser.id } : "skip"
  );

  const updateSettings = useMutation(api.users.updateUserSettings);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const updateProfilePicture = useMutation(api.users.updateProfilePicture);
  const removeProfilePicture = useMutation(api.users.removeProfilePicture);
  const deleteAccount = useMutation(api.users.deleteUserAccount);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");

  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [hasProfileChanges, setHasProfileChanges] = useState(false);

  // Profile picture state
  const [showPictureDialog, setShowPictureDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize form values when data loads
  useEffect(() => {
    if (convexUser) {
      setFirstName(convexUser.firstName || "");
      setLastName(convexUser.lastName || "");
      setUsername(convexUser.username || "");
    }
  }, [convexUser]);

  // Track changes in profile fields
  const initialValues = useRef({ firstName: "", lastName: "", username: "" });

  useEffect(() => {
    if (convexUser) {
      initialValues.current = {
        firstName: convexUser.firstName || "",
        lastName: convexUser.lastName || "",
        username: convexUser.username || "",
      };
    }
  }, [convexUser]);

  useEffect(() => {
    const changed =
      firstName !== initialValues.current.firstName ||
      lastName !== initialValues.current.lastName ||
      username !== initialValues.current.username;
    setHasProfileChanges(changed);
  }, [firstName, lastName, username]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSaveProfile = async () => {
    if (!clerkUser?.id) {
      toast.error("User not authenticated");
      return;
    }

    setIsProfileSaving(true);
    try {
      await updateSettings({
        externalId: clerkUser.id,
        firstName,
        lastName,
        username,
      });

      // Update initial values after successful save
      initialValues.current = { firstName, lastName, username };
      setHasProfileChanges(false);

      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
      console.error(error);
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleCancelProfile = () => {
    setFirstName(initialValues.current.firstName);
    setLastName(initialValues.current.lastName);
    setUsername(initialValues.current.username);
    setHasProfileChanges(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPicture = async () => {
    if (!selectedFile || !clerkUser?.id) return;

    setIsUploading(true);
    try {
      // Step 1: Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      const { storageId } = await result.json();

      // Step 3: Update user profile with new picture
      await updateProfilePicture({
        externalId: clerkUser.id,
        storageId,
      });

      toast.success("Profile picture updated successfully!");
      setShowPictureDialog(false);
      setSelectedFile(null);
      setPreviewUrl("");
    } catch (error) {
      toast.error("Failed to upload picture. Please try again.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!clerkUser?.id) return;

    setIsRemoving(true);
    try {
      await removeProfilePicture({
        externalId: clerkUser.id,
      });
      toast.success("Profile picture removed successfully!");
    } catch (error) {
      toast.error("Failed to remove picture. Please try again.");
      console.error(error);
    } finally {
      setIsRemoving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDeleteAccount = async () => {
    if (!clerkUser?.id) {
      toast.error("User not authenticated");
      return;
    }

    if (deleteConfirmation !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      // Delete from Convex database
      await deleteAccount({
        externalId: clerkUser.id,
      });

      toast.success("Account deleted successfully");

      // Sign out from Clerk and redirect
      await signOut();
      window.location.href = "/";
    } catch (error) {
      toast.error("Failed to delete account. Please try again.");
      console.error(error);
      setIsDeleting(false);
    }
  };

  // Get the current profile picture (prioritize Convex, fallback to Clerk)
  const currentProfilePicture = convexUser?.pictureUrl || clerkUser?.imageUrl;

  return (
    <div className="flex-1 space-y-6 max-w-3xl">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and how others see you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={currentProfilePicture}
                alt={clerkUser?.fullName || ""}
              />
              <AvatarFallback className="text-lg">
                {clerkUser?.fullName ? getInitials(clerkUser.fullName) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium mb-1">Profile Picture</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Update your profile picture to personalize your account
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPictureDialog(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
                {convexUser?.pictureUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRemovePicture}
                    disabled={isRemoving}
                  >
                    {isRemoving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Name Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={clerkUser?.primaryEmailAddress?.emailAddress || ""}
                placeholder="your.email@example.com"
                className="flex-1"
                disabled
              />
              <Badge
                variant="secondary"
                className="flex items-center gap-1 px-3"
              >
                <Check className="h-3 w-3" />
                Verified
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              This is your primary email address
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
            />
          </div>

          {/* Account Created */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Account Created</p>
              <p className="text-xs text-muted-foreground">
                {clerkUser?.createdAt
                  ? new Date(clerkUser.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCancelProfile}
              disabled={!hasProfileChanges || isProfileSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={!hasProfileChanges || isProfileSaving}
            >
              {isProfileSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50">
            <div className="space-y-1">
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type <span className="font-bold">DELETE</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE"
                className="font-mono"
              />
            </div>
            <div className="rounded-lg bg-destructive/10 p-4 space-y-2">
              <p className="text-sm font-medium text-destructive">
                What will be deleted:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Your profile and account information</li>
                <li>All your documentation collections</li>
                <li>All your uploaded files and data</li>
                <li>Your account settings and preferences</li>
              </ul>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation("");
              }}
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              className="flex-1"
              disabled={deleteConfirmation !== "DELETE" || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Picture Dialog */}
      <Dialog open={showPictureDialog} onOpenChange={setShowPictureDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Upload a new profile picture. Supported formats: JPG, PNG, GIF
              (max 5MB)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Preview or Upload Area */}
            {previewUrl ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={previewUrl} alt="Preview" />
                  </Avatar>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl("");
                    }}
                    className="flex-1"
                  >
                    Choose Different
                  </Button>
                  <Button
                    onClick={handleUploadPicture}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
              >
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-1">Click to upload</p>
                <p className="text-xs text-muted-foreground">
                  or drag and drop your image here
                </p>
              </div>
            )}

            {selectedFile && (
              <div className="text-xs text-muted-foreground text-center">
                Selected: {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
