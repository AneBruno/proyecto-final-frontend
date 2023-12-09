import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FormBaseComponent } from 'src/app/shared/form-base.component';
import { ListadoDataSource } from 'src/app/shared/listado.datasource';
import { ListadoComponent } from 'src/app/shared/listados/listado.component';
import { ApiService } from 'src/app/shared/services/api.service';
import { LocatorService } from 'src/app/shared/services/locator.service';

@Component({
  selector: 'app-historial-consultar',
  templateUrl: './historial-consultar.component.html',
  styleUrls: ['./historial-consultar.component.scss']
})
export class HistorialConsultarComponent extends ListadoComponent implements OnInit {


  public title                  : string = "Consultar negocio";
  public idBase                 : any; //Id para poder completar la orden con los datos de la posición
  public posicion               : any ;
  public fecha?                 : Date;
  public puertos                : any;
  public usuarios               : any;
  public listaEmpresas?         : Array<any>;
  public posicionesAgrupadas?   : Array<any>;
  public condicionesPago        : Array<any> = [];
  public localidades            : Array<any> = [];
  public ordenes?               : Array<any>;
  formularioPosicion?           : FormGroup;
  public orden_id?              : number;
  public orden                  : any;
  public form!                  : FormGroup;
  protected fb  = LocatorService.injector.get(FormBuilder);
  public clave                  : any;

  constructor(
    public  dataSource  : ListadoDataSource<any>,
    private route       : ActivatedRoute,
    private formBuilder: FormBuilder,
    private apiService         : ApiService,
  ) {
    super();
   }

  public async ngOnInit(): Promise<void> {
    this.createForm();
    //this.watchRoute();
  }

  private async createForm(){
    this.orden_id = this.route.snapshot.params.orden;
    console.log("this.orden_id",this.orden_id);
    this.form = this.fb.group({

      //posicion de compra
      producto_posicion              : new FormControl({ value: '',    disabled: false  }),
      empresa_posicion               : new FormControl({ value: '',    disabled: false  }),
      comision_comprador_cierre      : new FormControl({ value: '',    disabled: false  }),
      destino_posicion               : new FormControl({ value: '',    disabled: false  }),
      precio_posicion                : new FormControl({ value: '',    disabled: false  }),
      forma_pago_posicion            : new FormControl({ value: '',    disabled: false  }),
      cosecha_posicion               : new FormControl({ value: '',    disabled: false  }),
      observaciones_posicion         : new FormControl({ value: '',    disabled: false  }),
      //usuario_carga_posicion         : new FormControl({ value: '',    disabled: false  }),
      volumen_posicion               : new FormControl({ value: '',    disabled: false  }),
      
      //orden de venta:
      volumen                        : new FormControl({ value: '',    disabled: false  }),
      posicion_id                    : new FormControl({ value: '',    disabled: false  }),
      
      producto_orden                 : new FormControl({ value: '',    disabled: false  }),
      empresa_orden                  : new FormControl({ value: '',    disabled: false  }),
      comision_vendedor_cierre       : new FormControl({ value: '',    disabled: false  }),
      destino_orden                  : new FormControl({ value: '',    disabled: false  }),
      precio_orden                   : new FormControl({ value: '',    disabled: false  }),
      forma_pago_orden               : new FormControl({ value: '',    disabled: false  }),
      observaciones_orden            : new FormControl({ value: '',    disabled: false  }),
      cosecha_orden                  : new FormControl({ value: '',    disabled: false  }),
     //usuario_carga_orden            : new FormControl({ value: '',    disabled: false  }),

      //datos cierre
      precio_cierre_slip             : new FormControl({ value: '',    disabled: false  }),
      toneladas_cierre               : new FormControl({ value: '',    disabled: false  }),
      precio_total                   : new FormControl({ value: '',    disabled: false  }),
      precio_comision_comprador      : new FormControl({ value: '',    disabled: false  }),
      precio_comision_vendedor       : new FormControl({ value: '',    disabled: false  }),
    });

    //obtengo orden.
    this.orden = await this.apiService.getData(`/mercado/ordenes/${this.orden_id}`).toPromise();
    console.log("orden",this.orden);   
    //obtengo el id de la posición con la que se cerró el negocio.
    this.clave = this.orden.posicion_id;
    console.log("clave pos", this.clave);
    //traigo la posicion con la que se cerró el negocio.
    const relations = 'empresa,producto,puerto,condicionPago,usuarioCarga,cosecha';
    this.posicion = await this.apiService.getData(`/mercado/posiciones/${this.clave}`, { with_relation: relations }).toPromise()    
    console.log("this.posicion", this.posicion);

    this.completarForm();
  }

  private async completarForm(){
       
    const relations = 'empresa,producto,puerto,condicionPago,usuarioCarga';
    this.orden = await this.apiService.getData('/mercado/ordenes/' + this.orden_id, { with_relation: relations }).toPromise();
    console.log('this.orden',this.orden);
    this.usuarios = await this.apiService.getData('/usuarios').toPromise();
    //this.form.get('posicion_id').setValue(this.posicion.id);
    this.form?.get('empresa_posicion')?.setValue(this.posicion.empresa.razon_social);
    this.form?.get('comision_comprador_cierre')?.setValue(this.orden.comision_comprador_cierre? this.orden.comision_comprador_cierre +'%':0+'%');
    this.form?.get('producto_posicion')?.setValue(this.posicion.producto.nombre);
    this.form?.get('destino_posicion')?.setValue(this.posicion.puerto.nombre);
    this.form?.get('precio_posicion')?.setValue(this.posicion.moneda + '' +this.posicion.precio);
    this.form?.get('forma_pago_posicion')?.setValue(this.posicion.condicion_pago?.descripcion);
    this.form?.get('cosecha_posicion')?.setValue(this.posicion.cosecha.descripcion);
    this.form?.get('volumen_posicion')?.setValue(this.posicion.volumen);
    //this.form?.get('usuario_carga_posicion')?.setValue(this.usuarios.find((usuario:any) => usuario.id == this.posicion.usuario_carga_id).nombreCompleto);
    this.form?.get('observaciones_posicion')?.setValue(this.posicion.observaciones? this.posicion.observaciones : '-');

    this.form?.get('empresa_orden')?.setValue(this.orden.empresa.razon_social);
    this.form?.get('comision_vendedor_cierre')?.setValue(this.orden.comision_vendedor_cierre? this.orden.comision_vendedor_cierre+'%' :0+'%');
    this.form?.get('volumen')?.setValue(this.orden.volumen);
    this.form?.get('producto_orden')?.setValue(this.orden.producto.nombre);
    this.form?.get('observaciones_orden')?.setValue(this.orden.observaciones? this.orden.observaciones : '-');
    this.form?.get('destino_orden')?.setValue(this.orden.puerto.nombre);
    this.form?.get('precio_orden')?.setValue(this.orden.moneda +' '+ this.orden.precio);
    //this.form?.get('usuario_carga_orden')?.setValue(this.orden.usuario_carga.nombreCompleto);
    this.form?.get('forma_pago_orden')?.setValue(this.orden.condicion_pago.descripcion);

    //datos de cierre
    this.form?.get('precio_cierre_slip')?.setValue(this.orden.moneda + ' '+this.orden.precio_cierre_slip);
    this.form?.get('toneladas_cierre')?.setValue(this.orden.toneladas_cierre? this.orden.toneladas_cierre:'-');
    this.form?.get('precio_total')?.setValue(this.orden.moneda +' '+ this.orden.precio_cierre_slip * this.orden.toneladas_cierre);
    this.form?.get('precio_comision_comprador')?.setValue(this.orden.moneda + ' '+(this.orden.comision_comprador_cierre/100) * this.orden.toneladas_cierre * this.orden.precio_cierre_slip);
    this.form?.get('precio_comision_vendedor')?.setValue(this.orden.moneda + ' '+(this.orden.comision_vendedor_cierre/100) * this.orden.toneladas_cierre  * this.orden.precio_cierre_slip);
}

}
