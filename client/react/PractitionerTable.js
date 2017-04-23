import React from 'react';
import ReactMixin from 'react-mixin';
import { ReactMeteorData } from 'meteor/react-meteor-data';

import Avatar from 'react-toolbox/lib/avatar';

import { Table } from 'react-bootstrap';




Session.setDefault('selectedPractitioner', false);

export default class PractitionerTable extends React.Component {
  getMeteorData() {

    // this should all be handled by props
    // or a mixin!
    let data = {
      style: {
        opacity: Session.get('globalOpacity')
      },
      selected: [],
      practitioners: Practitioners.find().map(function(practitioner){
        let result = {
          _id: practitioner._id,
          name: '',
          phone: '',
          use: ''
        };

        if (practitioner.name && practitioner.name.text) {
          result.name = practitioner.name.text;
        }
        if (practitioner.telecom && practitioner.telecom[0] && practitioner.telecom[0].value) {
          result.phone = practitioner.telecom[0].value;
        }
        if (practitioner.telecom && practitioner.telecom[0] && practitioner.telecom[0].use) {
          result.use = practitioner.telecom[0].use;
        }
        return result;
      })
    };

    if (Session.get('darkroomEnabled')) {
      data.style.color = 'black';
      data.style.background = 'white';
    } else {
      data.style.color = 'white';
      data.style.background = 'black';
    }

    // this could be another mixin
    if (Session.get('glassBlurEnabled')) {
      data.style.filter = 'blur(3px)';
      data.style.webkitFilter = 'blur(3px)';
    }

    // this could be another mixin
    if (Session.get('backgroundBlurEnabled')) {
      data.style.backdropFilter = 'blur(5px)';
    }

    //console.log("data", data);

    return data;
  }
  handleChange(row, key, value) {
    const source = this.state.source;
    source[row][key] = value;
    this.setState({source});
  }

  handleSelect(selected) {
    this.setState({selected});
  }
  getDate(){
    return 'YYYY/MM/DD';
  }
  noChange(){
    return '';
  }
  rowClick(id){
    // set the user
    Session.set('selectedPractitioner', id);

    // set which tab is selected
    let state = Session.get('practitionerCardState');
    state['index'] = 2;
    Session.set('practitionerCardState', state);
  }
  render () {
    let tableRows = [];
    for (var i = 0; i < this.data.practitioners.length; i++) {
      tableRows.push(
      <tr className='practitionerRow' key={i} style={{cursor: 'pointer'}} onClick={ this.rowClick.bind('this', this.data.practitioners[i]._id) }>
        <td className="barcode">{this.data.practitioners[i]._id}</td>
        <td className="name">{this.data.practitioners[i].name}</td>
        <td className="phone">{this.data.practitioners[i].phone}</td>
        <td className="use">{this.data.practitioners[i].use}</td>
      </tr>);
    }


    return(
      <Table id="practitionersTable" responses hover >
        <thead>
          <tr>
            <th className="barcode">_id</th>
            <th className="name">name</th>
            <th className="phone">phone</th>
            <th className="use">use</th>
          </tr>
        </thead>
        <tbody>
          { tableRows }
        </tbody>
      </Table>

    );
  }
}



PractitionerTable.propTypes = {};
ReactMixin(PractitionerTable.prototype, ReactMeteorData);
