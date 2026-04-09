import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'home',
        loadComponent: () => import("./home/home").then((m) => m.Home),
    },
    {
        path: 'post',
        loadComponent: () => import("./posts.page/posts.page").then((m) => m.PostsPage),
    },
    {
        path: 'post-to-signal',
        loadComponent: () => import("./posts.page-using-to-signal/posts.page").then((m) => m.PostsPage),
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
    }
];
