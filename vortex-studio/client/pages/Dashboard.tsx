import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Link as LinkIcon,
  Copy,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Calendar,
  ExternalLink,
  TrendingUp,
  QrCode,
  Download,
  User,
  Mail,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { linksAPI } from "../lib/api";

interface ShortLink {
  _id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  clicks: number;
  createdAt: string;
  hasPassword: boolean;
  isActive: boolean;
  description?: string;
  password?: string;
}

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [password, setPassword] = useState("");
  const [description, setDescription] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [useCustomAlias, setUseCustomAlias] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [outputType, setOutputType] = useState<"url" | "qr" | "both">("url");
  const [shortUrl, setShortUrl] = useState("");
  const [generatedQRCode, setGeneratedQRCode] = useState("");
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    monthlyGrowth: 0,
  });

  // Get real user data from AuthContext
  const { user, logout, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Fetch user's links on component mount
  useEffect(() => {
    if (user) {
      fetchUserLinks();
      fetchDashboardStats();
    }
  }, [user]);

  const fetchUserLinks = async () => {
    try {
      setIsLoadingLinks(true);
      setError(null);

      // Call real API
      const response = await linksAPI.getUserLinks();
      console.log("API Response:", response); // Debug log

      if (response.success && response.data && response.data.links) {
        setLinks(response.data.links);
        console.log("Links set:", response.data.links); // Debug log
      } else {
        console.error("API response format issue:", response);
        setError("Failed to load links");
        // Fallback to empty array to show "No links" message
        setLinks([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch links:", error);
      setError(error.message || "Failed to load your links");
    } finally {
      setIsLoadingLinks(false);
    }
  };
  const fetchDashboardStats = async () => {
    try {
      const response = await linksAPI.getDashboardStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const generateQRCode = (text: string) => {
    const size = 200;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
    return qrUrl;
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast({
        variant: "destructive",
        title: "URL Required",
        description: "Please enter a destination URL",
      });
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Call real API
      const response = await linksAPI.createLink({
        originalUrl: url.trim(),
        customAlias: useCustomAlias ? customAlias.trim() : undefined,
        password: usePassword ? password : undefined,
        description: description.trim() || undefined,
      });

      if (response.success) {
        const newLink = response.data.link;

        // Set the generated short URL
        if (outputType === "url" || outputType === "both") {
          setShortUrl(newLink.shortUrl);
        }

        // Generate QR code if needed
        if (outputType === "qr" || outputType === "both") {
          const qrCodeUrl = generateQRCode(newLink.shortUrl);
          setGeneratedQRCode(qrCodeUrl);
        }

        // Success toast
        toast({
          title: "Link Created!",
          description: "Your short link has been generated successfully.",
        });

        // Refresh links list and stats
        await fetchUserLinks();
        await fetchDashboardStats();

        // Don't reset form immediately - let user see the results
        // Form will be reset when user clicks "Create Another" button
      } else {
        throw new Error(response.message || "Failed to create link");
      }
    } catch (error: any) {
      console.error("Failed to create link:", error);
      const errorMessage =
        error.message || "Failed to create link. Please try again.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: errorMessage,
      });
    } finally {
      setIsCreating(false);
    }
  };
  const handleLogout = async () => {
    try {
      await logout();
      // Logout will redirect to home page automatically
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Please try again",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Please copy manually",
      });
    }
  };

  const downloadQRCode = () => {
    if (generatedQRCode) {
      const link = document.createElement("a");
      link.href = generatedQRCode;
      link.download = "qr-code.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetForm = () => {
    setUrl("");
    setCustomAlias("");
    setPassword("");
    setDescription("");
    setUsePassword(false);
    setUseCustomAlias(false);
    setShortUrl("");
    setGeneratedQRCode("");
    setOutputType("url");
    setError(null);
  };

  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (shouldn't reach here due to ProtectedRoute, but safety check)
  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/dashboard")} // Changed from "/" to "/dashboard"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LinklyPro
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Button
              variant="ghost"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/links")}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              My Links
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/analytics")}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </nav>
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500">{user.plan}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all">
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} />
                  ) : (
                    <AvatarFallback>
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user.plan}</p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <div>
                    <p className="text-sm">{user.email}</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/settings")}
                  className="flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Links
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoadingLinks ? "..." : stats.totalLinks}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <LinkIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Clicks
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoadingLinks ? "..." : stats.totalClicks}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    This Month
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.monthlyGrowth > 0
                      ? `+${stats.monthlyGrowth}%`
                      : `${stats.monthlyGrowth}%`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create New Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create New Short Link</span>
              </CardTitle>
              <CardDescription>
                Shorten your URL and customize it with optional password
                protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Destination URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/your-long-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="h-11"
                    disabled={isCreating}
                  />
                </div>

                {/* Output Type Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    What would you like to generate?
                  </Label>
                  <div className="grid grid-cols-1 gap-3">
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        outputType === "url"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setOutputType("url")}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            outputType === "url" ? "bg-blue-100" : "bg-gray-100"
                          }`}
                        >
                          <LinkIcon
                            className={`w-5 h-5 ${outputType === "url" ? "text-blue-600" : "text-gray-600"}`}
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Short URL
                          </h3>
                          <p className="text-sm text-gray-500">
                            Generate a shortened link
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        outputType === "qr"
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setOutputType("qr")}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            outputType === "qr"
                              ? "bg-purple-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <QrCode
                            className={`w-5 h-5 ${outputType === "qr" ? "text-purple-600" : "text-gray-600"}`}
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">QR Code</h3>
                          <p className="text-sm text-gray-500">
                            Generate a QR code for the URL
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        outputType === "both"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setOutputType("both")}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            outputType === "both"
                              ? "bg-green-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <div className="flex space-x-1">
                            <LinkIcon
                              className={`w-4 h-4 ${outputType === "both" ? "text-green-600" : "text-gray-600"}`}
                            />
                            <QrCode
                              className={`w-4 h-4 ${outputType === "both" ? "text-green-600" : "text-gray-600"}`}
                            />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Both</h3>
                          <p className="text-sm text-gray-500">
                            Generate both short URL and QR code
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="custom-alias"
                      className="text-sm font-medium"
                    >
                      Custom alias (optional)
                    </Label>
                    <Switch
                      checked={useCustomAlias}
                      onCheckedChange={setUseCustomAlias}
                      disabled={isCreating}
                    />
                  </div>
                  {useCustomAlias && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">sh.ly/</span>
                      <Input
                        id="custom-alias"
                        placeholder="my-custom-link"
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value)}
                        className="flex-1"
                        disabled={isCreating}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password-protection"
                      className="text-sm font-medium"
                    >
                      Password protection
                    </Label>
                    <Switch
                      checked={usePassword}
                      onCheckedChange={setUsePassword}
                      disabled={isCreating}
                    />
                  </div>
                  {usePassword && (
                    <div className="relative">
                      <Input
                        id="password-protection"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        disabled={isCreating}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isCreating}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add a note about this link..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={isCreating}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isCreating || !url}
                >
                  {isCreating
                    ? "Generating..."
                    : outputType === "url"
                      ? "Create Short Link"
                      : outputType === "qr"
                        ? "Generate QR Code"
                        : "Generate Both"}
                </Button>
              </form>

              {/* Results Display */}
              {(shortUrl || generatedQRCode) && (
                <div className="mt-6 space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Generated Results
                    </h3>
                    <Button size="sm" variant="outline" onClick={resetForm}>
                      Create Another
                    </Button>
                  </div>

                  {shortUrl && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <LinkIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Short URL
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-800 font-medium break-all">
                          {shortUrl}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(shortUrl)}
                          className="ml-2 flex-shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {generatedQRCode && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <QrCode className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">
                          QR Code
                        </span>
                      </div>
                      <div className="flex flex-col items-center space-y-3">
                        <img
                          src={generatedQRCode}
                          alt="Generated QR Code"
                          className="w-48 h-48 border border-gray-200 rounded-lg"
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={downloadQRCode}
                            className="flex items-center space-x-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(url)}
                            className="flex items-center space-x-2"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Copy URL</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Links */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Links</CardTitle>
                  <CardDescription>
                    Your recently created short links
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate("/links")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingLinks ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {links.slice(0, 6).map((link) => (
                    <div
                      key={link._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p
                            className="text-sm font-medium text-blue-600 truncate cursor-pointer hover:text-blue-800 transition-colors"
                            onClick={() => window.open(link.shortUrl, "_blank")}
                            title="Click to open link"
                          >
                            {link.shortUrl}
                          </p>
                          {link.hasPassword && (
                            <Lock className="w-3 h-3 text-gray-400" />
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(link.shortUrl)}
                            className="p-1 h-auto"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {link.originalUrl}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500">
                            {link.clicks} clicks
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(link.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {link.clicks}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(link.shortUrl, "_blank")}
                          title="Open short link"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {links.length === 0 && (
                    <div className="text-center py-8">
                      <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No links created yet</p>
                      <p className="text-sm text-gray-400">
                        Create your first short link above
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your account and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/analytics")}
                className="h-auto p-4 flex flex-col items-center space-y-2"
              >
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium">View Analytics</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/settings")}
                className="h-auto p-4 flex flex-col items-center space-y-2"
              >
                <Settings className="w-6 h-6 text-gray-600" />
                <div className="text-sm font-medium">Account Settings</div>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
              >
                <LinkIcon className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-medium">Bulk Import</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
              >
                <Calendar className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium">Schedule Links</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
