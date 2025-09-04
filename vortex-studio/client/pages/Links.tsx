import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Link as LinkIcon,
  Copy,
  BarChart3,
  Settings,
  LogOut,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Lock,
  Eye,
  Calendar,
  Filter,
  Download,
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  QrCode,
  User,
  Mail,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { linksAPI, qrAPI } from "../lib/api";
import { AlertCircle } from "lucide-react";

interface LinkData {
  _id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  clicks: number;
  createdAt: string;
  lastClicked?: string | null;
  hasPassword: boolean;
  isActive: boolean;
  description?: string;
  device?: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  location?: {
    country: string;
    clicks: number;
  }[];
}

export default function Links() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created");
  const [filterBy, setFilterBy] = useState("all");
  const [links, setLinks] = useState<LinkData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Get real user data from AuthContext
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Fetch links with filters
  const fetchLinks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await linksAPI.getLinksWithFilter({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        status: filterBy === "all" ? undefined : filterBy,
        sortBy: sortBy === "created" ? "createdAt" : sortBy,
        sortOrder: "desc",
      });

      if (response.success) {
        setLinks(response.data.links);
        setTotalPages(response.data.pagination?.pages || 1);
      } else {
        setError("Failed to load links");
        setLinks([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch links:", error);
      setError(error.message || "Failed to load links");
      setLinks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load links on component mount and when filters change
  useEffect(() => {
    if (user) {
      fetchLinks();
    }
  }, [user, currentPage, searchTerm, filterBy, sortBy]);

  // Delete link function
  const handleDeleteLink = async (linkId: string) => {
    try {
      setIsDeleting(linkId);

      const response = await linksAPI.deleteLink(linkId);

      if (response.success) {
        toast({
          title: "Link Deleted",
          description: "The link has been successfully deleted.",
        });

        // Refresh the links list
        await fetchLinks();
      } else {
        throw new Error("Failed to delete link");
      }
    } catch (error: any) {
      console.error("Failed to delete link:", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Failed to delete link",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Toggle link status
  const handleToggleStatus = async (linkId: string) => {
    try {
      const response = await linksAPI.toggleStatus(linkId);

      if (response.success) {
        toast({
          title: "Status Updated",
          description: "Link status has been updated successfully.",
        });

        // Refresh the links list
        await fetchLinks();
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error: any) {
      console.error("Failed to toggle status:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update link status",
      });
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Please try again",
      });
    }
  };

  // Copy to clipboard with toast feedback
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

  const generateQRCode = (url: string) => {
    const size = 200;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
    return qrUrl;
  };

  const downloadQRCode = (url: string, filename: string) => {
    const qrCodeUrl = generateQRCode(url);
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `${filename}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate stats from real data
  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
  const activeLinks = links.filter((link) => link.isActive).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
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
              onClick={() => navigate("/dashboard")}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
              onClick={() => navigate("/settings")}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </nav>
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.plan}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all">
                  {user?.avatar ? (
                    <AvatarImage src={user.avatar} />
                  ) : (
                    <AvatarFallback>
                      {user ? getInitials(user.firstName, user.lastName) : "U"}
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
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user?.plan}</p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <div>
                    <p className="text-sm">{user?.email}</p>
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

        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Links</h1>
          <p className="text-gray-600">
            Manage and track all your shortened URLs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Links
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {links.length}
                  </p>
                </div>
                <LinkIcon className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Links
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeLinks}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-green-600" />
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
                    {totalClicks.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Avg. Clicks
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(totalClicks / links.length)}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search links..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Links</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="password">Password Protected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created">Date Created</SelectItem>
                    <SelectItem value="clicks">Most Clicks</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={() => navigate("/dashboard")}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  New Link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links Table */}
        <Card>
          <CardHeader>
            <CardTitle>Links ({links.length})</CardTitle>
            <CardDescription>
              All your shortened URLs with detailed analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Short URL</TableHead>
                    <TableHead>Original URL</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Device Split</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={8}>
                          <div className="animate-pulse h-16 bg-gray-200 rounded"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : links.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <LinkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No links found
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {searchTerm
                            ? "Try adjusting your search criteria"
                            : "Create your first short link to get started"}
                        </p>
                        <Button onClick={() => navigate("/dashboard")}>
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Create New Link
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    links.map((link) => (
                      <TableRow key={link._id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-600 font-medium">
                                  {link.shortUrl}
                                </span>
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
                              {link.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {link.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="max-w-xs">
                            <p
                              className="text-sm text-gray-900 truncate"
                              title={link.originalUrl}
                            >
                              {link.originalUrl}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-semibold">
                              {link.clicks.toLocaleString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              +12%
                            </Badge>
                          </div>
                          {link.lastClicked && (
                            <p className="text-xs text-gray-500">
                              Last:{" "}
                              {new Date(link.lastClicked).toLocaleDateString()}
                            </p>
                          )}
                        </TableCell>

                        <TableCell>
                          {link.device ? (
                            <div>
                              <div className="flex items-center space-x-1">
                                <div className="flex items-center text-xs text-gray-600">
                                  <Monitor className="w-3 h-3 mr-1" />
                                  {Math.round(
                                    (link.device.desktop / link.clicks) * 100,
                                  )}
                                  %
                                </div>
                                <div className="flex items-center text-xs text-gray-600">
                                  <Smartphone className="w-3 h-3 mr-1" />
                                  {Math.round(
                                    (link.device.mobile / link.clicks) * 100,
                                  )}
                                  %
                                </div>
                              </div>
                              <div className="flex space-x-1 mt-1">
                                <div className="flex-1 h-1 bg-blue-200 rounded">
                                  <div
                                    className="h-full bg-blue-600 rounded"
                                    style={{
                                      width: `${(link.device.desktop / link.clicks) * 100}%`,
                                    }}
                                  />
                                </div>
                                <div className="flex-1 h-1 bg-green-200 rounded">
                                  <div
                                    className="h-full bg-green-600 rounded"
                                    style={{
                                      width: `${(link.device.mobile / link.clicks) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">
                              No device data
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const qrWindow = window.open(
                                  "",
                                  "_blank",
                                  "width=400,height=400",
                                );
                                if (qrWindow) {
                                  qrWindow.document.write(`
                                  <html>
                                    <head><title>QR Code - ${link.shortCode}</title></head>
                                    <body style="margin:0;padding:20px;text-align:center;font-family:Arial,sans-serif;">
                                      <h3>QR Code for ${link.shortUrl}</h3>
                                      <img src="${generateQRCode(link.originalUrl)}" alt="QR Code" style="border:1px solid #ccc;border-radius:8px;" />
                                      <p style="margin-top:20px;font-size:12px;color:#666;">Scan to visit: ${link.originalUrl}</p>
                                    </body>
                                  </html>
                                `);
                                }
                              }}
                              className="flex items-center space-x-1"
                            >
                              <QrCode className="w-3 h-3" />
                              <span className="text-xs">View</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                downloadQRCode(link.originalUrl, link.shortCode)
                              }
                              className="flex items-center space-x-1 text-xs"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="text-sm text-gray-900">
                              {new Date(link.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(link.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={link.isActive ? "default" : "secondary"}
                          >
                            {link.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <BarChart3 className="w-4 h-4 mr-2" />
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Link
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  downloadQRCode(
                                    link.originalUrl,
                                    link.shortCode,
                                  )
                                }
                              >
                                <QrCode className="w-4 h-4 mr-2" />
                                Download QR Code
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(link.shortUrl, "_blank")
                                }
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Visit Link
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteLink(link._id)}
                                className="text-red-600"
                                disabled={isDeleting === link._id}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {isDeleting === link._id
                                  ? "Deleting..."
                                  : "Delete Link"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
