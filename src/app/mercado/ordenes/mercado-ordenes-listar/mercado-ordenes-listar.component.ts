import * as moment from 'moment';
import { BreakpointObserver            } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild  } from '@angular/core';
import { MatInput                      } from '@angular/material/input';
import { AuthService                   } from 'src/app/auth/shared/services/auth.service';
import { ListadoDataSource             } from 'src/app/shared/listado.datasource';
import { ListadoComponent              } from 'src/app/shared/listados/listado.component';
import { ApiService } from 'src/app/shared/services/api.service';
import { ConfirmService } from 'src/app/shared/services/confirm.service';
import { UserService } from 'src/app/auth/shared/services/user.service';
import { User } from 'src/app/shared/models/user.model';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';
import { EmpresaHelper } from '../../empresa.helper';

@Component({
    selector    :   'app-mercado-ordenes-listar',
    templateUrl :   './mercado-ordenes-listar.component.html',
    styleUrls   : [ './mercado-ordenes-listar.component.scss' ],
    providers   : [ ListadoDataSource ]
})
export class MercadoOrdenesListarComponent extends ListadoComponent implements OnInit {

    @ViewChild('filtroFechaDesde', {
        read: MatInput
    }) filtroFechaDesde?: MatInput;
    @ViewChild('filtroFechaHasta', {
        read: MatInput
    }) filtroFechaHasta?: MatInput;

    public  cosechas            : any[] = [];
    public fechaDesde?          : Date | null;
    public fechaHasta?          : Date | null;
    public formasPago           : Array<any> = [];
    public comerciales          : Array<any> = [];
    public puertos              : Array<any> = [];
    public productos            : Array<any> = [];
    public empresas             : Array<any> = [];
    public fechaActual          : Date     = new Date();
    public anioActual           : Number   = this.fechaActual.getFullYear();
    public mesActual            : Number   = this.fechaActual.getMonth() + 1; //Le sumo 1 porque enero es el mes 0
    public estados              : any;
    public rol_id_usuario?            : Number;
    private ESTADO_ELIMINADA = 5;
    public filtroProductosOpciones : any = {
        ordenes: {
            nombre: 'asc',
        }
    }
    public filtroComercialesOpciones : any = {
        ordenes: {
            id_matches: this.userService.getUser().id,
            rol: [2, 3, 4, 6, 1, 5],
            nombre_completo: 'asc'
        }
    }
    public currentUser?: User;

    //Filtros multiples
    public filtroProductos! : Array<any>;
    public filtroPuertos!   : Array<any>;
    public filtroEmpresa!    : Array<any>;
    public filtroFormaPago!    : Array<any>;
    public filtroEstado        : Array<any> = ['1', '3'];
    public filtroCosecha      : Array<any> = [];


    public constructor(
        public  dataSource         : ListadoDataSource<any>,
        public  authService        : AuthService,
        public userService        : UserService,
        private breakPointObserver : BreakpointObserver,
        private apiService         : ApiService,
        private confirm            : ConfirmService,
        private empresaHelper      : EmpresaHelper,
    ) {
        super();
    }

    public async ngOnInit(): Promise<void> {
        registerLocaleData( es );
        this.dataSource.autoStart = false;
        this.currentUser = this.userService.getUser();

        this.comerciales          = await this.apiService.getData('/usuarios', {ordenes: {descripcion:'DESC'}}).toPromise();
        this.cosechas   = await this.apiService.getAllData('/mercado/cosechas', {ordenes: {descripcion:'DESC'}}).toPromise();
        await this.loadRelatedData();

        this.estados = await this.apiService.getData('/mercado/ordenes/estados').toPromise();
        this.dataSource.uri         = '/mercado/ordenes';
        this.dataSource.queryParams = {
            with_relation : 'puerto,producto,empresa,usuarioCarga,condicionPago,cosecha',
            ordenes: {
                "id": "DESC"
            }
        };


        this.breakPointObserver.observe([
            '(max-width: 768px)'
        ]).subscribe(result => {
            this.clearColumns();
            this.addColumn('created_at',    'Fecha',     '50px').renderFn(row => this.formatearFecha(row.created_at));
            this.addColumn('vendedor',      'Empresa vendedora',  '180px').renderFn(row => this.empresaHelper.obtenerNombreEmpresa(row.empresa)).setAsCustom();
            this.addColumn('cosecha',      'Cosecha',       '120px').renderFn(row => row.cosecha.descripcion);
            this.addColumn('producto',      'Producto',       '120px').renderFn(row => row.producto.nombre);
            this.addColumn('toneladas', 'Toneladas', '80px').renderFn(row =>  {
            
                const toneladas = parseFloat(row.volumen); // Convierte el valor a número decimal
                if (row.volumen === null || toneladas === 0) {
                    return '0'; // Si row.volumen es null, muestra "0"
                }
                // Verifica si los decimales son distintos de cero
                if (toneladas === Math.floor(toneladas)) {
                    return Math.floor(toneladas); // Si son iguales a cero, muestra solo el número entero
                } else {
                    return toneladas.toFixed(2); // Si son distintos de cero, muestra dos decimales
                }
            });
            this.addColumn('destino',       'Puerto de destino',   '120px').renderFn(row => this.calculaDestino(row));
            this.addColumn('forma_pago', 'Forma de Pago', '120px').renderFn(row => row.condicion_pago.descripcion);
            //this.addColumn('volumen',       'Toneladas',   '50px').renderFn(row => row.volumen).setAsNumber();
            this.addColumn('precio_moneda', 'Precio',    '100px').renderFn(row => `${row.moneda} ${row.precio}`).setAlign('left');
            this.addColumn('estado',        'Estado',    '80px').renderFn(row => (this.estados.find((estado: any) => estado.id == row.estado_id)).nombre)
            this.addColumn('_acciones',     'Acciones',   '10px').setAsMenu().setAlign('right');

            if (result.matches) {
                this.getColumn('producto' ).setWidth('200px');
                this.getColumn('destino'  ).setWidth('200px');
                this.getColumn('estado'   ).setWidth('200px');
            }
        });
        this.actualizarDatos();
    }

    public async loadRelatedData() {
      this.puertos = await this.apiService.getData('/puertos', {
          'filtros[estado]': 'todos',
          'limit' : 0,
         }).toPromise();
      this.productos =  await this.apiService.getData('/productos',{
        'ordenes[nombre]': 'asc',
        'limit' : 0,
      }).toPromise();
      this.buscarEmpresas();
      this.formasPago = await this.apiService.getAllData('/mercado/condiciones-pago', 
      {ordenes: {descripcion:'DESC'}}).toPromise();
    }

    public buscarEmpresas(busqueda?: any) {
        let filtros: any = {};
        filtros.perfil = "VENDEDOR";
        if (busqueda) {
            filtros.busqueda = busqueda;
        }
        this.apiService.getData('/clientes/empresas', {
            filtros: filtros,
            ordenes: {
                razon_social:'ASC'
            }
        }).subscribe(data => {
            this.empresas = data;
        });
    }

    public calculaDestino(row:any) {
        if (row.puerto){
            return row.puerto?.nombre
        } else {
            return row.localidad_destino;
        }
    }

    public formatearFecha(fecha:any) {
        return moment(fecha).format('DD/MM');
    }


    public actualizarDatos() {
        this.configurarFiltros();
        this.dataSource.refreshData();
    }

    public configurarFiltros() {
        if (this.fechaDesde) {
            this.dataSource.filtros.fechaDesde = moment(this.fechaDesde).format('YYYY-MM-DD');
        }

        if (this.fechaHasta) {
            this.dataSource.filtros.fechaHasta = moment(this.fechaHasta).format('YYYY-MM-DD');
        }
        if (this.filtroEstado){
            this.dataSource.filtros.estado_id = this.filtroEstado;
        }
    }

    public onClearFilters() {
        this.fechaDesde = null;
        this.fechaHasta = null;

        this.filtroProductos = [];
        this.filtroPuertos   = [];
        this.filtroEmpresa   = [];
        this.filtroFormaPago = [];
        this.filtroCosecha   = [];
        this.filtroEstado       = ['1', '3'];
        //this.filtroComercial = null;
        this.actualizarDatos();
    }


    public estadoPosicion(id:number, estado:number){
      var mensaje = '';
      if (estado == this.ESTADO_ELIMINADA) {
        mensaje = 'Desea eliminar la orden?';
      }
      this.confirm.ask(mensaje).subscribe(() => {
        this.apiService.patch('/mercado/ordenes/' + id + '/estado', {'estado_id':estado}).subscribe(() => {
            this.dataSource.refreshData();
        });
      });
    }

    isRepresentante() {
        return this.currentUser?.rol.id === 4;
    }

    getPuertoParams() {
        return {
            'filtros[estado]': 'todos'
        };
    }

    public selecetionChangeMultiple(event : any, filterName : string) : void {
        let filtro : Array<any> = event.source.value;
        if(filtro.length === 0 || filtro.includes( '' )){
            delete  this.dataSource.filtros[filterName];
            this.dataSource.refreshData();
            return;
        }
        this.dataSource.filtros[filterName] = filtro;
        this.dataSource.refreshData();
    }

    getEstadoColor(estado: string): string {
        switch (estado) {
          case 'Activa': // Reemplaza 'Valor1' con el valor real
            return 'green'; // Color para Valor1
          case 'Confirmada': // Reemplaza 'Valor2' con el valor real
            return 'blue'; // Color para Valor2
          case 'Eliminada': // Reemplaza 'Valor3' con el valor real
            return 'red'; // Color para Valor3
          default:
            return 'black'; // Color predeterminado si no coincide con ningún valor
        }
      }

      public isInterno(): any {
        if(this.currentUser?.rol_id===3){
          return true;
        }else{
          return false;
        }
    }

    public isCliente(): any {
        if(this.currentUser?.rol_id===4){
            return true;
        }else{
            return false;
        }
    }

}
