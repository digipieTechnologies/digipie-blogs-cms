import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Trash2, Search, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import toast from "react-hot-toast";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  service?: string;
  message: string;
  status: string;
  created_at: string;
}

export function Inquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  async function loadInquiries() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("contact_inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (err) {
      console.error("Error loading inquiries:", err);
      toast.error(
        "Failed to load inquiries. Make sure the 'contact_inquiries' table is created.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInquiries();
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      setIsDeleting(deleteConfirmId);
      const { error } = await supabase
        .from("contact_inquiries")
        .delete()
        .eq("id", deleteConfirmId);
      if (error) throw error;
      toast.success("Submission deleted successfully!");
      setInquiries((prev) =>
        prev.filter((item) => item.id !== deleteConfirmId),
      );
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete submission.");
    } finally {
      setIsDeleting(null);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("contact_inquiries")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      toast.success("Status updated!");
      setInquiries((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item,
        ),
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  const filteredInquiries = inquiries.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      (item.phone && item.phone.includes(search)) ||
      (item.service && item.service.toLowerCase().includes(search.toLowerCase())) ||
      item.message.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-8 mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Contact Inquiries
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            View form submissions and inquiries from the main website.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inquiries..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="rounded-md border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden subtle-shadow">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4" /> Received Submissions (
            {filteredInquiries.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Loading submissions...</p>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No submissions found.
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/50">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Name</th>
                      <th className="px-6 py-3 font-semibold">Contact Info</th>
                      <th className="px-6 py-3 font-semibold">Service</th>
                      <th className="px-6 py-3 font-semibold w-1/3 min-w-[300px]">
                        Message
                      </th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredInquiries.map((item) => (
                      <tr
                        key={item.id}
                        className="group hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-medium whitespace-nowrap text-foreground">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-foreground space-y-0.5">
                          <div className="font-medium">{item.email}</div>
                          {item.phone && (
                            <div className="text-xs text-muted-foreground">
                              {item.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-foreground">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            {item.service || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {item.message}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            className={`text-xs font-semibold rounded-full px-2.5 py-1 border outline-none bg-background cursor-pointer ${
                              (item.status || "pending") === "pending"
                                ? "text-amber-700 border-amber-200 bg-amber-50"
                                : (item.status || "pending") === "replied"
                                  ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                                  : "text-blue-700 border-blue-200 bg-blue-50"
                            }`}
                            value={item.status || "pending"}
                            onChange={(e) =>
                              updateStatus(item.id, e.target.value)
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="replied">Replied</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteConfirmId(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden flex flex-col divide-y divide-border/50">
                {filteredInquiries.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 space-y-4 hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {item.name}
                        </h4>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {new Date(item.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => setDeleteConfirmId(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-1.5 bg-muted/20 p-3 rounded-md border border-border/50">
                      <div className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                        {item.email}
                      </div>
                      {item.phone && (
                        <div className="text-xs text-muted-foreground pl-5.5">
                          {item.phone}
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {item.message}
                    </div>

                    <div className="pt-3 mt-2 flex items-center justify-between border-t border-border/50">
                      <span className="text-xs font-medium text-muted-foreground">
                        Status
                      </span>
                      <select
                        className={`text-xs font-semibold rounded-full px-2.5 py-1 border outline-none bg-background cursor-pointer ${
                          (item.status || "pending") === "pending"
                            ? "text-amber-700 border-amber-200 bg-amber-50"
                            : (item.status || "pending") === "replied"
                              ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                              : "text-blue-700 border-blue-200 bg-blue-50"
                        }`}
                        value={item.status || "pending"}
                        onChange={(e) => updateStatus(item.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="replied">Replied</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Submission"
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              disabled={isDeleting !== null}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={isDeleting !== null}
            >
              {isDeleting !== null ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground py-2">
          Are you sure you want to delete this submission? This action cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
}
