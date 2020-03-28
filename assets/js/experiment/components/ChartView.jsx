/* global fetch, EventSource */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Chart from './../../components/Chart'
import Button from 'react-bootstrap/Button'

class ChartView extends Component {
  // @see https://www.amcharts.com/docs/v4/getting-started/integrations/using-react/
  componentDidMount () {
    const handleAddLogEntry = this.props.onHandleAddLogEntry || (() => {})
    const chart = new Chart({
      series: this.props.series,
      bullet: {
        onHit: function (event) {
          const chart = this.getChart()
          chart.closeAllPopups()
          const popup = chart.openPopup('Add annotation …')
          popup.left = event.svgPoint.x + 15
          popup.top = event.svgPoint.y + 15
          popup.title = ''
          popup.content = '<button class="btn btn-add-annotation">Add annotation</button>'
          const button = popup.elements.content.querySelector('button')
          button.addEventListener('click', function (event) {
            // alert(arguments)
            if (handleAddLogEntry) {
              handleAddLogEntry({
                loggedAt: (new Date()).toISOString(),
                sensor: 'null'
              })
            }
          })
        }
      },
      legend: true,
      cursor: true,
      scrollbars: true
    })

    this.chart = chart

    fetch(this.props.dataUrl, { headers: { accept: 'application/json' } })
      .then((response) => {
        return response.json()
      })
      .then(measurements => {
        measurements.forEach(this.addMeasurement)

        const eventSource = new EventSource(this.props.eventSourceUrl)
        eventSource.onmessage = event => {
          const data = JSON.parse(event.data)
          if (data.measurement) {
            this.addMeasurement(data.measurement)
          }
        }
      })
  }

  addMeasurement = (measurement) => {
    const series = measurement.sensor.id
    if (series !== null && series in this.props.series) {
      const data = {
        date: new Date(measurement.measuredAt),
        [series]: measurement.value
      }

      this.chart.addData(data)
    }
  }

  getChart () {
    return this.chart.getChart()
  }

  handleAddLogEntry = () => {
    const logEntry = {
      loggedAt: (new Date('1975-05-23')).toISOString(),
      sensor: '/api/sensors/device:001:temperature'
    }
    this.props.onHandleAddLogEntry && this.props.onHandleAddLogEntry(logEntry)
  }

  render () {
    return (
      <section className='chart-view'>
        <header className='d-flex justify-content-between'>
          <div><h1>Chart</h1></div>
          <div className='log-action'>
            {this.props.onHandleAddLogEntry && <Button className='btn-add-annotation' onClick={this.handleAddLogEntry}>Add log entry</Button>}
          </div>
        </header>

        <div className='chart-view-content'>
          <div id='chart' />
        </div>
      </section>
    )
  }
}

ChartView.propTypes = {
  series: PropTypes.object.isRequired,
  dataUrl: PropTypes.string.isRequired,
  eventSourceUrl: PropTypes.string.isRequired,
  onHandleAddLogEntry: PropTypes.func
}

export default ChartView
