import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { getAllSellers, updateSeller, deleteSeller, createSeller, deactivateSeller, activateSeller, type Seller } from '@/api/admin';
import {
  Users,
  Loader2,
  MapPin,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  Plus,
  Power,
  PowerOff,
  Store
} from 'lucide-react';

export function SellersPage() {
  const { token } = useAuth();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMarket, setFilterMarket] = useState<string>('all');

  // Edit dialog
  const [editDialog, setEditDialog] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    marketLocation: '',
    stallName: '',
    stallNumber: '',
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Create seller dialog
  const [createDialog, setCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    marketLocation: 'San Nicolas Market',
    stallName: '',
    stallNumber: ''
  });
  const [creating, setCreating] = useState(false);

  // Deactivation state
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  const fetchSellers = async () => {
    if (!token) return;

    try {
      const filters: { market?: string } = {};
      if (filterMarket !== 'all') {
        filters.market = filterMarket;
      }

      const response = await getAllSellers(token, filters);
      if (response.success && response.sellers) {
        setSellers(response.sellers);
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [token, filterMarket]);

  const handleEditClick = (seller: Seller) => {
    setSelectedSeller(seller);
    setEditForm({
      name: seller.name,
      email: seller.email,
      marketLocation: seller.marketLocation || '',
      stallName: seller.stallName || '',
      stallNumber: seller.stallNumber || '',
      isActive: seller.isActive
    });
    setEditDialog(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedSeller) return;

    setSaving(true);
    try {
      const response = await updateSeller(token, selectedSeller._id, editForm);
      if (response.success) {
        setEditDialog(false);
        fetchSellers();
      }
    } catch (error) {
      console.error('Error updating seller:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (seller: Seller) => {
    setSelectedSeller(seller);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!token || !selectedSeller) return;

    setDeleting(true);
    try {
      const response = await deleteSeller(token, selectedSeller._id);
      if (response.success) {
        setDeleteDialog(false);
        setSelectedSeller(null);
        fetchSellers();
      }
    } catch (error) {
      console.error('Error deleting seller:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !createForm.name || !createForm.email || !createForm.marketLocation) return;

    setCreating(true);
    try {
      const response = await createSeller(token, createForm);
      if (response.success) {
        setCreateDialog(false);
        setCreateForm({ name: '', email: '', marketLocation: '', stallName: '', stallNumber: '' });
        fetchSellers();
      }
    } catch (error) {
      console.error('Error creating seller:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (seller: Seller) => {
    if (!token) return;

    setTogglingStatus(seller._id);
    try {
      const response = seller.isActive
        ? await deactivateSeller(token, seller._id)
        : await activateSeller(token, seller._id);
      if (response.success) {
        fetchSellers();
      }
    } catch (error) {
      console.error('Error toggling seller status:', error);
    } finally {
      setTogglingStatus(null);
    }
  };

  const filteredSellers = sellers.filter(seller =>
    seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">SELLER ACCOUNT</h1>
            <p className="text-muted-foreground">Manage seller accounts and information</p>
          </div>
          <Button onClick={() => setCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Seller
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterMarket} onValueChange={setFilterMarket}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by market" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Markets</SelectItem>
              <SelectItem value="San Nicolas Market">San Nicolas Market</SelectItem>
              <SelectItem value="Pampang Public Market">Pampang Public Market</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredSellers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sellers found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search term' : 'No sellers registered yet'}
              </p>
              <Button onClick={() => setCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Seller
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                SELLER ACCOUNT
              </CardTitle>
              <CardDescription>
                {filteredSellers.length} seller{filteredSellers.length > 1 ? 's' : ''} {searchQuery && 'found'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Market</TableHead>
                    <TableHead>Stall Name</TableHead>
                    <TableHead>Stall No.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSellers.map((seller, index) => (
                    <TableRow key={seller._id}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          {seller.name}
                        </div>
                      </TableCell>
                      <TableCell>{seller.email}</TableCell>
                      <TableCell>
                        {seller.marketLocation ? (
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {seller.marketLocation.replace(' Market', '')}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {seller.stallName ? (
                          <span className="font-medium">{seller.stallName}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {seller.stallNumber ? (
                          <Badge variant="outline">#{seller.stallNumber}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {seller.isActive ? (
                          <Badge className="bg-primary">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {seller.isVerified ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>{formatDate(seller.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(seller)}
                            disabled={togglingStatus === seller._id}
                            title={seller.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {togglingStatus === seller._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : seller.isActive ? (
                              <PowerOff className="h-4 w-4 text-amber-500" />
                            ) : (
                              <Power className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit"
                            onClick={() => handleEditClick(seller)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(seller)}
                            className="text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Seller Account</DialogTitle>
              <DialogDescription>
                Update seller account information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-market">Market Location</Label>
                <Select
                  value={editForm.marketLocation}
                  onValueChange={(value) => setEditForm({ ...editForm, marketLocation: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="San Nicolas Market">San Nicolas Market</SelectItem>
                    <SelectItem value="Pampang Public Market">Pampang Public Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-stallName">Stall Name</Label>
                  <Input
                    id="edit-stallName"
                    value={editForm.stallName}
                    onChange={(e) => setEditForm({ ...editForm, stallName: e.target.value })}
                    placeholder="e.g., Fresh Produce"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stallNumber">Stall Number</Label>
                  <Input
                    id="edit-stallNumber"
                    value={editForm.stallNumber}
                    onChange={(e) => setEditForm({ ...editForm, stallNumber: e.target.value })}
                    placeholder="e.g., A-15"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-isActive">Account Active</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Seller Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the seller account for "{selectedSeller?.name}"? 
                This will also delete all their products. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Seller Dialog */}
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Seller</DialogTitle>
              <DialogDescription>
                Create a new seller account. They will receive an email with login credentials.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSeller} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Full Name</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-market">Market Location</Label>
                <Select
                  value={createForm.marketLocation}
                  onValueChange={(value) => setCreateForm({ ...createForm, marketLocation: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="San Nicolas Market">San Nicolas Market</SelectItem>
                    <SelectItem value="Pampang Public Market">Pampang Public Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-stallName">Stall Name</Label>
                  <Input
                    id="create-stallName"
                    value={createForm.stallName}
                    onChange={(e) => setCreateForm({ ...createForm, stallName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-stallNumber">Stall Number</Label>
                  <Input
                    id="create-stallNumber"
                    value={createForm.stallNumber}
                    onChange={(e) => setCreateForm({ ...createForm, stallNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !createForm.name || !createForm.email || !createForm.marketLocation}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Seller'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
