import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from 'src/app/auth/shared/services/user.service';
import { ListadoDataSource            } from 'src/app/shared/listado.datasource';
import { ListadoComponent } from 'src/app/shared/listados/listado.component';
import { User } from 'src/app/shared/models/user.model';
import { ApiService } from 'src/app/shared/services/api.service';
import { EmpresaHelper } from '../empresa.helper';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { MatInput } from '@angular/material/input';
import { ConfirmService } from 'src/app/shared/services/confirm.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-historial-negocios',
  templateUrl: './historial-negocios.component.html',
  styleUrls: ['./historial-negocios.component.scss'],
  providers   : [ ListadoDataSource ]
})
export class HistorialNegociosComponent extends ListadoComponent implements OnInit {

  @ViewChild('filtroFechaDesde', {
    read: MatInput
  }) filtroFechaDesde?: MatInput;
  @ViewChild('filtroFechaHasta', {
      read: MatInput
  }) filtroFechaHasta?: MatInput;
  
  public currentUser?             : User;
  public estados                 : any;
  public posicion                : any = null;
  public empresa                 : any;
  public empresas?                : Array<any>;
  public puertos                 : Array<any> = [];
  public productos               : Array<any> = [];
  public formasPago              : Array<any> = [];
  public empresasCompradoras     : Array<any> = [];
  public empresasVendedoras      : Array<any> = [];
  public fechaDesde?              : Date;
  public fechaHasta?              : Date;
  public fechaActual             : Date     = new Date();
  public anioActual              : Number   = this.fechaActual.getFullYear();
  public mesActual               : Number   = this.fechaActual.getMonth() + 1; //Le sumo 1 porque enero es el mes 0

  //Filtros multiples
  public filtroProductos!            : Array<any>;
  public filtroPuertos!              : Array<any>;
  public filtroFormaPago!            : Array<any>;
  public filtroEmpresaCompradora!    : Array<any>;
  public filtroEmpresaVendedora!     : Array<any>;
  
  constructor(
    public  dataSource           : ListadoDataSource<any>,
    private apiService           : ApiService,
    private userService          : UserService,
    private empresaHelper        : EmpresaHelper,
    private route                : ActivatedRoute,
    private confirm              : ConfirmService,
    
  ) {
    super();
   }

  public async ngOnInit(): Promise<void> {
      this.dataSource.uri = '/mercado/historial';
      this.dataSource.queryParams = {
        with_relation : 'puerto,producto,empresa,estado,posicion,condicionPago'
      };
      this.dataSource.fixedFilters.estados = [3];
      //@ts-ignore
      window['dataSource'] = this.dataSource;

      this.dataSource.ordenes = {
        id: 'desc'
      }
      this.currentUser = this.userService.getUser();
      this.empresas = await this.apiService.getData('/clientes/empresas').toPromise();
      //console.log(this.empresas);
      await this.loadRelatedData();
      this.setTable();
      this.actualizarDatos();
  }

  private setTable() : void {
    this.clearColumns();
    this.addColumn('fecha',     'Fecha cierre', '110px').renderFn(row => this.formatearFecha(row.updated_at));
    this.addColumn('comprador',     'Comprador', '150px').renderFn(row => row.posicion? (this.empresas?.find(empre => empre.id == row.posicion.empresa_id)).razon_social : '-');
    this.addColumn('comision_comprador',     'Comisión comprador', '100px').renderFn(row => row.comision_comprador_cierre?  row.comision_comprador_cierre+'%': 0);
    this.addColumn('vendedor',     'Vendedor', '150px').renderFn(row => this.empresaHelper.obtenerNombreEmpresa(row.empresa));
    this.addColumn('comision_vendedor',     'Comisión vendedor', '100px').renderFn(row => row.comision_vendedor_cierre? row.comision_vendedor_cierre+'%': 0);
    this.addColumn('producto',      'Producto',       '120px').renderFn(row => row.producto.nombre);
    this.addColumn('toneladas_cierre',      'Toneladas',       '90px').renderFn(row => row.toneladas_cierre? row.toneladas_cierre: '-');
    this.addColumn('destino',       'Puerto de destino',   '120px').renderFn(row => this.calculaDestino(row));
    this.addColumn('forma_pago',       'Forma de pago',   '120px').renderFn(row => row.condicion_pago.descripcion);
    this.addColumn('moneda_precio', 'Precio',    '80px').renderFn(row => row.precio_cierre_slip? `${row.moneda} ${row.precio_cierre_slip}`: '-').setAlign('left');
    this.addColumn('_acciones',     'Acciones',   '40px').setAsMenu().setAlign('right');
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
    this.formasPago = await this.apiService.getAllData('/mercado/condiciones-pago', {
      ordenes: {descripcion:'DESC'}
    }).toPromise();
    this.buscarEmpresasCompradoras();
    this.buscarEmpresasVendedora();
  }

  public onClearFilters() {
    this.fechaDesde = undefined;
    this.fechaHasta = undefined;
    this.filtroProductos = [];
    this.filtroPuertos = [];
    this.filtroFormaPago    = [];
    this.filtroEmpresaCompradora=[];
    this.filtroEmpresaVendedora=[];
  }

  //para filtros de seleccion multiple
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

  public calculaDestino(row:any) {
  return row.puerto?.nombre
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
  }

  public buscarEmpresasCompradoras(busqueda?: any) {
    let filtros: any = {};
    filtros.perfil = "COMPRADOR";
    if (busqueda) {
        filtros.busqueda = busqueda;
    }
    this.apiService.getData('/clientes/empresas', {
        filtros: filtros,
        ordenes: {
            razon_social:'ASC'
        }
    }).subscribe(data => {
        this.empresasCompradoras = data;
    });
  }

  public buscarEmpresasVendedora(busqueda?: any) {
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
        this.empresasVendedoras = data;
    });
  }

  public async cancelarNegocio(orden_id: any){
      var mensaje;
      mensaje = 'Desea cancelar el negocio?';
      this.confirm.ask(mensaje).subscribe(() => {
        this.apiService.put('/mercado/historial/' + orden_id + '/cancelarSlip', {}).subscribe( () => {
              this.dataSource.refreshData();
            }
          );
      });
  }

  public isInterno(): any {
    if(this.currentUser?.rol_id===3){
      return true;
    }else{
      return false;
    }
  }

  exportToXLSX() {
    // Obtén la referencia a la tabla HTML
    const table = document.querySelector('.mat-table');
  
    // Array para almacenar los datos de la tabla, incluyendo el encabezado
    const data: any = [];
  
    // Obtén las filas de la tabla
    const rows = table?.querySelectorAll('.mat-header-row, .mat-row');
  
    // Itera a través de las filas
    rows?.forEach((row) => {
      const rowData: any = [];
  
      // Obtén las celdas de cada fila (ya sea th o td)
      const cells = row.querySelectorAll('.mat-cell, .mat-header-cell');
  
      cells.forEach((cell) => {
        rowData.push(cell.textContent); // Usa textContent en lugar de innerText
      });
  
      data.push(rowData);
    });
  
    // Crea una hoja de cálculo de datos
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
  
    // Crea un libro de Excel
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historial de negocios');
  
    // Guarda el archivo en formato .xlsx
    XLSX.writeFile(wb, 'historial-negocios.xlsx');
  }
  
  
}
