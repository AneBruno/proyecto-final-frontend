import { NgModule             } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RouteGuard           } from './shared/guards/route.guard';
import { LoginGuard           } from './shared/guards/login.guard';
import { DashboardComponent   } from './shared/dashboard/dashboard.component';
import { LoginComponent       } from './auth/login/login.component';
import { DashboardResolver    } from './shared/resolvers/dashboard.resolver';
import { MercadoPanelListarComponent } from '../app/mercado/panel/mercado-panel-listar/mercado-panel-listar.component';
import { RegistroComponent } from './auth/registro/registro.component';
import { RegistroExitoComponent } from './auth/registro-exito/registro-exito.component';


const routes: Routes = [
    {
        path       : '',
        pathMatch  : 'full',
        redirectTo : 'app'
    },
    {
        path: 'login',
        component: LoginComponent,
    },
    {
        path: 'registro',
        component: RegistroComponent,
    },
    {
        path: 'registro-exito',
        component: RegistroExitoComponent,
    },
    {
        path             : 'app',
        component        : DashboardComponent,
        canActivate      : [ LoginGuard ],
        canActivateChild : [ RouteGuard ],
        resolve          : { state: DashboardResolver, },
        children: [
            {
                path:'',
                component: MercadoPanelListarComponent,
            },
            {
                path: 'usuarios',
                loadChildren: () => import('./usuarios/usuarios.module').then(m => m.UsuariosModule),
            },
            {
                path: 'productos',
                loadChildren: () => import('./productos/productos.module').then(m => m.ProductosModule),
            },
            {
                path: 'clientes',
                loadChildren: () => import('./clientes/clientes.module').then(m => m.ClientesModule),
            },
            {
                path: 'puertos',
                loadChildren: () => import('./puertos/puertos.module').then(m => m.PuertosModule),
            },
            {
                path: 'mercado',
                loadChildren: () => import('./mercado/mercado.module').then(m => m.MercadoModule),
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
