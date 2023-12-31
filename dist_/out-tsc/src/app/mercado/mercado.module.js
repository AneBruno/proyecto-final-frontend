import { __decorate } from "tslib";
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MercadoRoutingModule } from './mercado-routing.module';
import { CondicionesPagoEditarComponent } from './condiciones-pago/condiciones-pago-editar/condiciones-pago-editar.component';
import { CondicionesPagoListarComponent } from './condiciones-pago/condiciones-pago-listar/condiciones-pago-listar.component';
import { MercadoPosicionesEditarComponent } from './posiciones/mercado-posiciones-editar/mercado-posiciones-editar.component';
import { MercadoPosicionesListarComponent } from './posiciones/mercado-posiciones-listar/mercado-posiciones-listar.component';
import { MercadoPanelListarComponent } from './panel/mercado-panel-listar/mercado-panel-listar.component';
import { SharedModule } from '../shared/shared.module';
import { MercadoOrdenesListarComponent } from './ordenes/mercado-ordenes-listar/mercado-ordenes-listar.component';
import { MercadoOrdenesEditarComponent } from './ordenes/mercado-ordenes-editar/mercado-ordenes-editar.component';
import { CosechasListarComponent } from './cosechas/cosechas-listar/cosechas-listar.component';
import { CosechasEditarComponent } from './cosechas/cosechas-editar/cosechas-editar.component';
import { GestionOfertasComponent } from './gestion-ofertas/gestion-ofertas.component';
import { CerrarSlipComponent } from './gestion-ofertas/cerrar-slip/cerrar-slip.component';
import { RetirarEliminarPosicionComponent } from './panel/carteles/retirar-eliminar-posicion/retirar-posicion.component';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MercadoOrdenesFormComponent } from './ordenes/mercado-ordenes-form/mercado-ordenes-form.component';
let MercadoModule = class MercadoModule {
};
MercadoModule = __decorate([
    NgModule({
        declarations: [
            CondicionesPagoListarComponent,
            CondicionesPagoEditarComponent,
            MercadoPosicionesEditarComponent,
            MercadoPosicionesListarComponent,
            MercadoPanelListarComponent,
            MercadoOrdenesListarComponent,
            MercadoOrdenesEditarComponent,
            CosechasListarComponent,
            CosechasEditarComponent,
            GestionOfertasComponent,
            CerrarSlipComponent,
            RetirarEliminarPosicionComponent,
            MercadoOrdenesFormComponent,
        ],
        imports: [
            CommonModule,
            SharedModule,
            MercadoRoutingModule,
        ],
        schemas: [
            NO_ERRORS_SCHEMA
        ],
        providers: [
            { provide: MAT_DATE_LOCALE, useValue: 'es-AR' },
            {
                provide: MAT_DATE_FORMATS,
                useValue: {
                    parse: {
                        dateInput: [
                            'YYYY-MM-DD',
                            'DD-MM-YYYY',
                        ],
                    },
                    display: {
                        dateInput: 'DD/MM/YYYY',
                        monthYearLabel: 'MMM YYYY',
                        dateA11yLabel: 'DD-MM-YYYY',
                        monthYearA11yLabel: 'MMMM YYYY',
                    },
                },
            },
            {
                provide: DateAdapter,
                useClass: MomentDateAdapter,
                deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
            },
            {
                provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS,
                useValue: { useUtc: true }
            },
        ]
    })
], MercadoModule);
export { MercadoModule };
//# sourceMappingURL=mercado.module.js.map