import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { getAllSellers, updateSeller, deleteSeller, createSeller, type Seller } from '@/api/admin';
import {
  Users,
  Loader2,
  MapPin,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  Plus
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
    marketLocation: ''
  });
  const [creating, setCreating] = useState(false);

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
      isActive: seller.isActive
    });
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!token || !selectedSeller) return;

    setSaving(true);
    try {
      const response = await updateSeller(token, selectedSeller._id, editForm);
      if (response.success) {
        fetchSellers();
        setEditDialog(false);
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
        setSellers(sellers.filter(s => s._id !== selectedSeller._id));
        setDeleteDialog(false);
      }
    } catch (error) {
      console.error('Error deleting seller:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateSeller = async () => {
    if (!token || !createForm.name || !createForm.email || !createForm.marketLocation) return;

    setCreating(true);
    try {
      const response = await createSeller(token, createForm);
      if (response.success) {
        fetchSellers();
        setCreateDialog(false);
        setCreateForm({ name: '', email: '', marketLocation: '' });
      }
    } catch (error) {
      console.error('Error creating seller:', error);
    } finally {
      setCreating(false);
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
            <h1 className="text-3xl font-bold text-foreground">All Sellers</h1>
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
              <SelectItem value="Pampanga Market">Pampanga Market</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredSellers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sellers found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'No sellers registered yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSellers.map((seller) => (
                  <TableRow key={seller._id}>
                    <TableCell className="font-medium">{seller.name}</TableCell>
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
                      <Badge variant={seller.isActive ? 'default' : 'secondary'}>
                        {seller.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {seller.isVerified ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(seller.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(seller)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteClick(seller)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Seller</DialogTitle>
              <DialogDescription>
                Update seller information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="market">Market Location</Label>
                <Select
                  value={editForm.marketLocation}
                  onValueChange={(value) => setEditForm({ ...editForm, marketLocation: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="San Nicolas Market">San Nicolas Market</SelectItem>
                    <SelectItem value="Pampanga Market">Pampanga Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Account Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Seller</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedSeller?.name}? This will also delete all their products. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Delete Seller
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Seller Dialog */}
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Seller</DialogTitle>
              <DialogDescription>
                Create a new seller account. They will receive an email with login credentials.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newName">Name</Label>
                <Input
                  id="newName"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Seller name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newEmail">Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="seller@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newMarket">Market Location</Label>
                <Select
                  value={createForm.marketLocation}
                  onValueChange={(value) => setCreateForm({ ...createForm, marketLocation: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="San Nicolas Market">San Nicolas Market</SelectItem>
                    <SelectItem value="Pampanga Market">Pampanga Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSeller} disabled={creating || !createForm.name || !createForm.email || !createForm.marketLocation}>
                {creating && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Create Seller
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
