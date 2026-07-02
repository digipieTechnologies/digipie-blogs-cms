import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import type { Blog } from '@/types';

export const blogKeys = {
  all: ['blogs'] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (id: string) => [...blogKeys.details(), id] as const,
};

export function useBlogs() {
  return useQuery({
    queryKey: blogKeys.all,
    queryFn: () => db.getBlogs(),
  });
}

export function useBlog(id: string | undefined) {
  return useQuery({
    queryKey: blogKeys.detail(id!),
    queryFn: () => db.getBlog(id!),
    enabled: !!id,
  });
}

export function useCreateBlog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (blog: Partial<Blog>) => db.createBlog(blog),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
  });
}

export function useUpdateBlog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, blog }: { id: string; blog: Partial<Blog> }) => db.updateBlog(id, blog),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(variables.id) });
    },
  });
}

export function useDeleteBlog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => db.deleteBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
  });
}
