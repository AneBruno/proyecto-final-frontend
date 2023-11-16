import * as moment            from 'moment';
import es                     from '@angular/common/locales/es';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit  } from '@angular/core';
import { ActivatedRoute     } from '@angular/router';
import { ListadoDataSource  } from 'src/app/shared/listado.datasource';
import { ListadoComponent   } from 'src/app/shared/listados/listado.component';
import { ApiService         } from 'src/app/shared/services/api.service';
import { registerLocaleData } from '@angular/common';
import { FormGroup, FormBuilder } from '@angular/forms';
import { User } from 'src/app/shared/models/user.model';
import { UserService } from 'src/app/auth/shared/services/user.service';

@Component({
    selector    : 'app-gestion-ofertas',
    templateUrl : './gestion-ofertas.component.html',
    styleUrls   : ['./gestion-ofertas.component.scss']
})
export class GestionOfertasComponent extends ListadoComponent implements OnInit {

    public idBase               : any; //Id para poder completar la orden con los datos de la posición
    public posicion             : any = null;
    public fecha?                : Date ;
    public puertos              : any;
    public usuarios             : any;
    public listaEmpresas?        : Array<any>;
    public posicionesAgrupadas?  : Array<any>;
    public condicionesPago      : Array<any> = [];
    public localidades          : Array<any> = [];
    formularioPosicion:         FormGroup;
    public currentUser?          : User;
    

    public constructor(
        public  dataSource         : ListadoDataSource<any>,
        private apiService         : ApiService,
        private route              : ActivatedRoute,
        private breakPointObserver : BreakpointObserver,
        private formBuilder        : FormBuilder,
        private userService        : UserService,
        
    ) {
        super();
        this.formularioPosicion = this.formBuilder.group({
            producto_posicion: [''],
            precio_posicion: [''],
            observaciones_posicion: [''],
            destino_posicion: [''],
            forma_pago_posicion: [''],
            empresa_posicion: [''],
            cosecha_posicion: [''],
            usuario_carga_posicion: [''],
            volumen_posicion: ['']
        });
    }

    public async ngOnInit(): Promise<void> {
        registerLocaleData( es );
        this.dataSource.autoStart = false;
        this.currentUser = this.userService.getUser();

        await this.loadRelatedData();

        this.dataSource.uri         = '/mercado/ordenes';
        this.dataSource.queryParams = {
            with_relation : 'puerto,producto,empresa,estado,usuarioCarga,condicionPago,cosecha'
        };
        this.dataSource.fixedFilters.estados = [1];
        this.dataSource.fixedFilters.producto_id =[this.posicion.producto_id];
        this.dataSource.fixedFilters.condicion_pago_id = [this.posicion.forma_pago_id];
        this.dataSource.fixedFilters.puerto_id = [this.posicion.puerto_id];
        this.dataSource.fixedFilters.moneda = [this.posicion.moneda];
        this.dataSource.fixedFilters.cosecha_id = [this.posicion.cosecha_id];
        //@ts-ignore
        window['dataSource'] = this.dataSource;

        this.dataSource.ordenes = {
            precio: 'asc'
        }
        this.breakPointObserver.observe([
            '(max-width: 768px)'
        ]).subscribe(result => {
            this.clearColumns();
            this.addColumn('vendedor',    'Vendedora',          '150px').renderFn(row => row.empresa.razon_social);
            this.addColumn('cosecha',    'Cosecha',          '120px').renderFn(row => row.cosecha.descripcion);
            this.addColumn('producto',    'Producto',          '120px').renderFn(row => row.producto.nombre);
            this.addColumn('tonelada',    'Toneladas',     '100px').renderFn(row => row.volumen).setAsNumber();
            this.addColumn('destino',     'Puerto de destino',      '150px').renderFn(row => this.calculaDestinoOfertas(row));
            this.addColumn('forma_pago',    'Forma de pago',          '120px').renderFn(row => row.condicion_pago.descripcion);
            this.addColumn('precio',      'Precio',       '100px').renderFn(row => row.moneda + ' '+ row.precio);
            this.addColumn('usuario_carga',      'Cargada por',       '100px').renderFn(row => row.usuario_carga.nombre + ' '+ row.usuario_carga.apellido);
            //this.addColumn('_acciones',   'Acciones',      '30px').setAsMenu().setAlign('right');

            if (result.matches) {
                this.getColumn('vendedor' ).setWidth('400px');
                this.getColumn('estado'   ).setWidth('200px');
                this.getColumn('destino'  ).setWidth('200px');
            }
        });

        this.dataSource.refreshData();
    }

    public obtenerClavePosicion(): Promise<string> {
        return new Promise((resolve) => {
            this.route.params.subscribe(async (params) => {
                if (params.clave) {
                    resolve(params.clave);
                }
            });
        });
    }

    public async loadRelatedData() {
        this.puertos = await this.apiService.getData('/puertos', {
            'filtros[estado]': 'todos',
            'limit' : 0,
        }).toPromise();
        this.condicionesPago = await this.apiService.getData('/mercado/condiciones-pago').toPromise();
        this.usuarios = await this.apiService.getData('/usuarios').toPromise();
        let clave    = await this.obtenerClavePosicion();
        const relations = 'usuarioCarga';
        let posicion = await this.apiService.getData('/mercado/panel/' + clave, { with_relation: relations }).toPromise();
        this.completarPosicion(posicion);
        this.completarFiltrosPorDefecto();
    }

    private async completarPosicion(posicion: any) {
        this.posicion = {
            producto_id           : posicion.producto.id,
            producto              : posicion.producto.nombre,
            prod                  : posicion.producto,
            precio_moneda         : posicion.moneda + ' ' + posicion.precio,
            precio                : posicion.precio,
            puerto                : posicion.puerto.nombre,
            puert                 : posicion.puerto,
            puerto_id             : posicion.puerto.id,
            moneda                : posicion.moneda,
            forma_pago            : posicion.condicion_pago.descripcion,
            forma_pago_id         : posicion.condicion_pago.id,
            formap                : posicion.condicion_pago,
            cosecha               : posicion.cosecha,
            cosecha_id            : posicion.cosecha.id,
            empresa               : posicion.empresa,
            observaciones         : posicion.observaciones,
            usuario_carga_id      : posicion.usuario_carga_id,
            volumen               : posicion.volumen

        };
        // Agregar localidad de la posición si no se encuentra previamente.
        let localidadIndex = this.localidades.findIndex(localidad => localidad.localidad_destino == posicion.localidad_destino);
        if (localidadIndex === -1) {
            this.localidades.push({localidad_destino: posicion.localidad_destino});
        }
        this.listaEmpresas = this.empresasToString([posicion.empresa])??[];
        this.posicionesAgrupadas = posicion.posiciones;
        this.idBase = posicion.id;
        console.log("this.posicion", this.posicion);
        // Llena el FormGroup con los valores
        this.formularioPosicion.setValue({
            empresa_posicion: this.posicion.empresa.razon_social,
            producto_posicion: this.posicion.producto,
            precio_posicion: this.posicion.precio_moneda,
            observaciones_posicion: this.posicion.observaciones? this.posicion.observaciones: '-',
            destino_posicion: this.posicion.puerto,
            forma_pago_posicion: this.posicion.forma_pago,
            cosecha_posicion : this.posicion.cosecha.descripcion,
            volumen_posicion: this.posicion.volumen,
            usuario_carga_posicion: this.usuarios.find((usuario: any) => usuario.id == this.posicion.usuario_carga_id).nombreCompleto


        });
    }

    public completarFiltrosPorDefecto() {
        this.dataSource.fixedFilters = {};
        this.dataSource.fixedFilters.producto_id = this.posicion.producto.id;
        /*this.dataSource.fixedFilters.puerto_id = this.posicion.puerto.id;
        this.dataSource.fixedFilters.condicion_pago_id = this.posicion.condicion_pago.id;*/
        this.dataSource.fixedFilters.fecha = moment().format('YYYY-MM-DD');

        this.dataSource.setDefaultFilters({
            //puerto_id               : this.posicion.puerto.id,
            //condicion_pago_id       : this.posicion.condicion_pago.id,
            precioDesde             : 0
            //moneda                  : this.posicion.moneda,
        });

    }

    public calculaDestinoOfertas(row:any) {
        return row.puerto.nombre;
    }

    private empresasToString(listaEmpresas: Array<any>) {
        if (listaEmpresas != null) {
          return listaEmpresas.map(x => {
              return x.razon_social;
          }).filter((x,i,a) => a.indexOf(x) == i);
        }
        return null
    }

    // Se usa este método para evitar que se mande el timeZone en el filtro
    // No quitar
    public actualizarConFechaFormateada(campo: string, date: any): any {
        this.dataSource.filtros[campo] = moment(date).format('YYYY-MM-DD');
        this.dataSource.refreshData();
    }
   
    public isInterno(): any {
        if(this.currentUser?.rol_id===3){
          return true;
        }else{
          return false;
        }
    }
}

