"use client";

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Upload, Loader2, Search } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Category, Subcategory } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

// Shadcn UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// React Hook Form & Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

// Zod Schemas
const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().optional(),
  image: z.string().optional(),
  description: z.string().optional(),
  status: z.boolean().default(true),
});

const subcategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  categoryId: z.string().min(1, "Please select a parent category"),
  slug: z.string().optional(),
  image: z.string().optional(),
  description: z.string().optional(),
  status: z.boolean().default(true),
});

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("categories");

  // Sheet States
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isSubcategorySheetOpen, setIsSubcategorySheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

  // Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'category' | 'subcategory' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Forms
  const categoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "", image: "", description: "", status: true },
  });

  const subcategoryForm = useForm<z.infer<typeof subcategorySchema>>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: { name: "", categoryId: "", slug: "", image: "", description: "", status: true },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchCategories(), fetchSubcategories()]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data.map((cat: any) => ({ ...cat, id: cat._id || cat.id })));
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch categories', variant: 'destructive' });
    }
  };

  const fetchSubcategories = async () => {
    try {
      const response = await fetch('/api/admin/subcategories');
      const result = await response.json();
      if (result.success) {
        setSubcategories(result.data.map((sub: any) => ({ ...sub, id: sub._id || sub.id })));
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch subcategories', variant: 'destructive' });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, form: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      form.setValue('image', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onCategorySubmit = async (values: z.infer<typeof categorySchema>) => {
    try {
      let imageUrlToUse = values.image || "";

      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('slug', values.slug || "");
      formData.append('description', values.description || "");
      formData.append('status', values.status.toString());
      if (imageUrlToUse) {
        formData.append('imageUrl', imageUrlToUse);
      }

      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, { method, body: formData });
      const result = await response.json();
      
      if (result.success) {
        toast({ title: editingCategory ? 'Category updated' : 'Category added' });
        setIsCategorySheetOpen(false);
        fetchCategories();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save category', variant: 'destructive' });
    } finally {
      setImageFile(null);
      setUploadProgress(0);
    }
  };

  const onSubcategorySubmit = async (values: z.infer<typeof subcategorySchema>) => {
    try {
      let imageUrlToUse = values.image || "";

      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('categoryId', values.categoryId);
      formData.append('slug', values.slug || "");
      formData.append('description', values.description || "");
      formData.append('status', values.status.toString());
      if (imageUrlToUse) {
        formData.append('imageUrl', imageUrlToUse);
      }

      const url = editingSubcategory ? `/api/admin/subcategories/${editingSubcategory.id}` : '/api/admin/subcategories';
      const method = editingSubcategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, { method, body: formData });
      const result = await response.json();
      
      if (result.success) {
        toast({ title: editingSubcategory ? 'Subcategory updated' : 'Subcategory added' });
        setIsSubcategorySheetOpen(false);
        fetchSubcategories();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save subcategory', variant: 'destructive' });
    } finally {
      setImageFile(null);
      setUploadProgress(0);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const url = itemToDelete.type === 'category' 
        ? `/api/admin/categories/${itemToDelete.id}`
        : `/api/admin/subcategories/${itemToDelete.id}`;
        
      const response = await fetch(url, { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        toast({ title: `${itemToDelete.type === 'category' ? 'Category' : 'Subcategory'} deleted` });
        if (itemToDelete.type === 'category') fetchCategories();
        else fetchSubcategories();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleToggleStatus = async (item: any, type: 'category' | 'subcategory', newStatus: boolean) => {
    try {
      const formData = new FormData();
      formData.append('name', item.name);
      formData.append('status', newStatus.toString());
      if (type === 'subcategory') {
        formData.append('categoryId', item.categoryId);
      }
      
      const url = type === 'category' ? `/api/admin/categories/${item.id}` : `/api/admin/subcategories/${item.id}`;
      
      // Optimistic UI update
      if (type === 'category') {
        setCategories(categories.map(c => c.id === item.id ? { ...c, status: newStatus } : c));
      } else {
        setSubcategories(subcategories.map(s => s.id === item.id ? { ...s, status: newStatus } : s));
      }

      const res = await fetch(url, { method: 'PUT', body: formData });
      if (!res.ok) throw new Error();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
      fetchData(); // Revert on failure
    }
  };

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredSubcategories = subcategories.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const openCategoryAdd = () => {
    setEditingCategory(null);
    categoryForm.reset({ name: "", slug: "", image: "", description: "", status: true });
    setIsCategorySheetOpen(true);
  };

  const openCategoryEdit = (c: Category) => {
    setEditingCategory(c);
    categoryForm.reset({ name: c.name, slug: c.slug, image: c.image || "", description: c.description || "", status: c.status !== false });
    setIsCategorySheetOpen(true);
  };

  const openSubcategoryAdd = () => {
    setEditingSubcategory(null);
    subcategoryForm.reset({ name: "", categoryId: "", slug: "", image: "", description: "", status: true });
    setIsSubcategorySheetOpen(true);
  };

  const openSubcategoryEdit = (s: Subcategory) => {
    setEditingSubcategory(s);
    subcategoryForm.reset({ name: s.name, categoryId: s.categoryId, slug: s.slug, image: s.image || "", description: s.description || "", status: s.status !== false });
    setIsSubcategorySheetOpen(true);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Categories & Subcategories</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={activeTab === 'categories' ? openCategoryAdd : openSubcategoryAdd} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" /> Add {activeTab === 'categories' ? 'Category' : 'Subcategory'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="categories" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img src={category.image || "https://via.placeholder.com/40"} alt={category.name} className="h-10 w-10 rounded object-cover border" />
                          <div className="font-medium">{category.name} <span className="text-xs text-muted-foreground block font-normal">/{category.slug}</span></div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">{category.description || "-"}</TableCell>
                      <TableCell>{category.productCount || 0}</TableCell>
                      <TableCell>
                        <Switch checked={category.status !== false} onCheckedChange={(c) => handleToggleStatus(category, 'category', c)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openCategoryEdit(category)}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setItemToDelete({ id: category.id, type: 'category' }); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="subcategories" className="space-y-4">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subcategory</TableHead>
                  <TableHead>Parent Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredSubcategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No subcategories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubcategories.map((subcategory) => (
                    <TableRow key={subcategory.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {subcategory.image ? (
                            <img src={subcategory.image} alt={subcategory.name} className="h-10 w-10 rounded object-cover border" />
                          ) : (
                            <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">No img</div>
                          )}
                          <div className="font-medium">{subcategory.name} <span className="text-xs text-muted-foreground block font-normal">/{subcategory.slug}</span></div>
                        </div>
                      </TableCell>
                      <TableCell>{subcategory.categoryName}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">{subcategory.description || "-"}</TableCell>
                      <TableCell>
                        <Switch checked={subcategory.status !== false} onCheckedChange={(c) => handleToggleStatus(subcategory, 'subcategory', c)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openSubcategoryEdit(subcategory)}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setItemToDelete({ id: subcategory.id, type: 'subcategory' }); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Category Form Sheet */}
      <Sheet open={isCategorySheetOpen} onOpenChange={setIsCategorySheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</SheetTitle>
            <SheetDescription>Fill in the details for the category.</SheetDescription>
          </SheetHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
              <div className="space-y-2">
                <FormLabel>Category Image</FormLabel>
                <div className="flex items-center gap-3">
                  {categoryForm.watch('image') && (
                    <img src={categoryForm.watch('image')} alt="Preview" className="w-16 h-12 object-cover rounded border" />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80 transition-colors">
                    <Upload className="h-4 w-4" /> Upload
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, categoryForm)} className="hidden" />
                  </label>
                </div>
              </div>
              <FormField control={categoryForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={categoryForm.control} name="slug" render={({ field }) => (
                <FormItem><FormLabel>Slug (Optional)</FormLabel><FormControl><Input {...field} placeholder="auto-generated-if-empty" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={categoryForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={categoryForm.control} name="status" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5"><FormLabel>Active Status</FormLabel><FormDescription>Enable or disable this category globally.</FormDescription></div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <Button type="submit" className="w-full mt-6" disabled={categoryForm.formState.isSubmitting}>
                {categoryForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
              {uploadProgress > 0 && uploadProgress < 100 && <p className="text-xs text-center text-muted-foreground mt-2">Uploading image: {uploadProgress}%</p>}
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Subcategory Form Sheet */}
      <Sheet open={isSubcategorySheetOpen} onOpenChange={setIsSubcategorySheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}</SheetTitle>
            <SheetDescription>Fill in the details for the subcategory.</SheetDescription>
          </SheetHeader>
          <Form {...subcategoryForm}>
            <form onSubmit={subcategoryForm.handleSubmit(onSubcategorySubmit)} className="space-y-4">
              <FormField control={subcategoryForm.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a parent category" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="space-y-2">
                <FormLabel>Subcategory Image (Optional)</FormLabel>
                <div className="flex items-center gap-3">
                  {subcategoryForm.watch('image') && (
                    <img src={subcategoryForm.watch('image')} alt="Preview" className="w-16 h-12 object-cover rounded border" />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80 transition-colors">
                    <Upload className="h-4 w-4" /> Upload
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, subcategoryForm)} className="hidden" />
                  </label>
                </div>
              </div>
              <FormField control={subcategoryForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={subcategoryForm.control} name="slug" render={({ field }) => (
                <FormItem><FormLabel>Slug (Optional)</FormLabel><FormControl><Input {...field} placeholder="auto-generated-if-empty" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={subcategoryForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={subcategoryForm.control} name="status" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5"><FormLabel>Active Status</FormLabel><FormDescription>Enable or disable this subcategory.</FormDescription></div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <Button type="submit" className="w-full mt-6" disabled={subcategoryForm.formState.isSubmitting}>
                {subcategoryForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSubcategory ? 'Update' : 'Create'} Subcategory
              </Button>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {itemToDelete?.type} and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
