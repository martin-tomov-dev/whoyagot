import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import MultiRangeSlider from './MultiRangeSlider';
import { useContext } from 'react';
import { FilterContext } from '../context/FilterContext';

function FilterModal(props) {
  const { filters, setFilters } = useContext(FilterContext);

  const applyFilters = () => {
    props.applyFilters();
    props.onHide();
  };

  return (
    <Modal
      show={props.show}
      onHide={props.onHide}
      size="md"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">Filters</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-5">
        <label className="d-block mt-3 mb-3">Spread Bets %</label>
        <MultiRangeSlider
          min={0}
          max={100}
          minValue={filters.spread.bets.min}
          maxValue={filters.spread.bets.max}
          onChange={({ min, max }) =>
            setFilters((prevFilter) => {
              const filter = prevFilter;
              filter.spread.bets.min = min;
              filter.spread.bets.max = max;
              return filter;
            })
          }
        />
        <label className="d-block mb-3">Spread Handled %</label>
        <MultiRangeSlider
          min={0}
          max={100}
          minValue={filters.spread.handled.min}
          maxValue={filters.spread.handled.max}
          onChange={({ min, max }) =>
            setFilters((prevFilter) => {
              const filter = prevFilter;
              filter.spread.handled.min = min;
              filter.spread.handled.max = max;
              return filter;
            })
          }
        />
        <hr />
        <label className="d-block mb-3">Moneyline Bets %</label>
        <MultiRangeSlider
          min={0}
          max={100}
          minValue={filters.moneyline.bets.min}
          maxValue={filters.moneyline.bets.max}
          onChange={({ min, max }) =>
            setFilters((prevFilter) => {
              const filter = prevFilter;
              filter.moneyline.bets.min = min;
              filter.moneyline.bets.max = max;
              return filter;
            })
          }
        />
        <label className="d-block mb-3">Moneyline Handled %</label>
        <MultiRangeSlider
          min={0}
          max={100}
          minValue={filters.moneyline.handled.min}
          maxValue={filters.moneyline.handled.max}
          onChange={({ min, max }) =>
            setFilters((prevFilter) => {
              const filter = prevFilter;
              filter.moneyline.handled.min = min;
              filter.moneyline.handled.max = max;
              return filter;
            })
          }
        />
        <hr />
        <label className="d-block mb-3">Total Bets %</label>
        <MultiRangeSlider
          min={0}
          max={100}
          minValue={filters.total.bets.min}
          maxValue={filters.total.bets.max}
          onChange={({ min, max }) =>
            setFilters((prevFilter) => {
              const filter = prevFilter;
              filter.total.bets.min = min;
              filter.total.bets.max = max;
              return filter;
            })
          }
        />
        <label className="d-block mb-3">Total Handled %</label>
        <MultiRangeSlider
          min={0}
          max={100}
          minValue={filters.total.handled.min}
          maxValue={filters.total.handled.max}
          onChange={({ min, max }) =>
            setFilters((prevFilter) => {
              const filter = prevFilter;
              filter.total.handled.min = min;
              filter.total.handled.max = max;
              return filter;
            })
          }
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={props.onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={applyFilters}>
          Apply Filters
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default FilterModal;