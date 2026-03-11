// Route access mapping
export const roleAccessMap: Record<string, string[]> = {
  superadmin: ['*'], // all routes - superadmin can access everything
  admin: ['properties', 'blogs', 'marketing', 'testimonials', 'settings'],
  'customer-manager': ['clients', 'settings'],
  user: ['settings'] // only settings
};

/**
 * Check if user has access to a route
 * Rule: If user has access to add and view, they automatically have edit access
 */
export const checkRouteAccess = (route: string, userRole: string | null): boolean => {
  if (!userRole) return false;
  
  // Superadmin has access to all routes
  if (userRole === 'superadmin') {
    return true;
  }
  
  // Get allowed routes for the role
  const allowedRoutes = roleAccessMap[userRole] || [];
  
  // Settings is accessible to all roles
  if (route.includes('/settings')) {
    return true;
  }
  
  // Users route is only for superadmin (already checked above)
  if (route.includes('/dashboard/users') || route.includes('/users')) {
    return false;
  }
  
  // Team route is only for superadmin (already checked above)
  if (route.includes('/team') && (route.includes('/en/') || route.includes('/es/') || route.includes('/fr/'))) {
    return false;
  }
  
  // Helper function to check if route matches a resource pattern
  const hasResourceAccess = (resourceKey: string): boolean => {
    return allowedRoutes.includes(resourceKey);
  };
  
  // Check route patterns - if user has access to resource, they can add, view, AND edit
  // Properties routes (all languages) - includes add-new, edit, manage, buy, rent
  if (route.includes('/properties')) {
    if (route.includes('/en/') || route.includes('/es/') || route.includes('/fr/')) {
      // If user has access to properties, they can add, view, and edit
      return hasResourceAccess('properties');
    }
  }
  
  // Blogs routes (all languages) - includes create-blog, edit-blog, manage-blogs
  if (route.includes('/blogs')) {
    if (route.includes('/en/') || route.includes('/es/') || route.includes('/fr/')) {
      // If user has access to blogs, they can add, view, and edit
      return hasResourceAccess('blogs');
    }
  }
  
  // Testimonials routes (all languages) - includes add, edit, manage
  if (route.includes('/testimonials')) {
    if (route.includes('/en/') || route.includes('/es/') || route.includes('/fr/')) {
      // If user has access to testimonials, they can add, view, and edit
      return hasResourceAccess('testimonials');
    }
  }
  
  // Off-plans routes (all languages) - includes add, edit, manage
  if (route.includes('/off-plans')) {
    if (route.includes('/en/') || route.includes('/es/') || route.includes('/fr/')) {
      // Off-plans are part of properties, so check properties access
      return hasResourceAccess('properties');
    }
  }
  
  // Marketing routes
  if (route.includes('/marketing')) {
    return hasResourceAccess('marketing');
  }
  
  // Clients routes
  if (route.includes('/clients')) {
    return hasResourceAccess('clients');
  }
  
  // Dashboard home
  if (route === '/' || route === '/dashboard') {
    return true; // Dashboard is accessible to all authenticated users
  }
  
  return false;
};


export const redirectIfUnauthorized = (
  route: string,
  userRole: string | null,
  router?: { push: (path: string) => void }
): boolean => {
  const hasAccess = checkRouteAccess(route, userRole);
  
  if (!hasAccess && router) {
    router.push('/');
    return false;
  }
  
  return hasAccess;
};

export const getRequiredRolesForRoute = (route: string): string[] => {
  if (route.includes('/dashboard/users') || route.includes('/users')) {
    return ['superadmin'];
  }
  
  if (route.includes('/team') && (route.includes('/en/') || route.includes('/es/') || route.includes('/fr/'))) {
    return ['superadmin'];
  }
  
  if (route.includes('/properties') || route.includes('/blogs') || route.includes('/testimonials') || route.includes('/marketing')) {
    return ['admin', 'superadmin'];
  }
  
  if (route.includes('/clients')) {
    return ['customer-manager', 'superadmin'];
  }
  
  if (route.includes('/settings')) {
    return ['superadmin', 'admin', 'customer-manager', 'user'];
  }
  
  return ['superadmin', 'admin', 'customer-manager', 'user']; // Default: all authenticated users
};
