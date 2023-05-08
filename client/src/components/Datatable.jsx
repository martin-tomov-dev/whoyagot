import React, { Fragment, useRef, useState } from 'react';
import { Table } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import FilterModal from './FilterModal';

import classes from './Datatable.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel, faFilter } from '@fortawesome/free-solid-svg-icons';
import Excel from 'exceljs';
import { saveAs } from 'file-saver';

function Datatable(props) {
  const tableRef = useRef(null);
  const [modalShow, setModalShow] = useState(false);

  const workbook = new Excel.Workbook();
  const workSheetName = 'Game Data';
  const workBookName = 'Exported Game data';

  const columns = [
    { header: 'Timing', key: 'timing' },
    { header: 'Team', key: 'team' },
    { header: 'Spread', key: 'spread' },
    { header: '% Bets', key: 'spread_bets' },
    { header: '% Handle', key: 'spread_handled' },
    { header: 'ML', key: 'moneyline' },
    { header: '% Bets', key: 'moneyline_bets' },
    { header: '% Handle', key: 'moneyline_handled' },
    { header: 'Total', key: 'total' },
    { header: '% Bets', key: 'total_bets' },
    { header: '% Handle', key: 'total_handled' },
    { header: 'Score', key: 'score' },
  ];

  const saveExcel = async () => {
    try {
      const fileName = workBookName;

      // creating one worksheet in workbook
      const worksheet = workbook.addWorksheet(workSheetName);

      // add worksheet columns
      // each columns contains header and its mapping key from data
      worksheet.columns = columns;

      // updated the font for first row.
      worksheet.getRow(1).font = { bold: true };

      // loop through all of the columns and set the alignment with width.
      worksheet.columns.forEach((column) => {
        column.width = column.header.length + 5;
        column.alignment = { horizontal: 'center' };
      });

      // loop through data and add each one to worksheet
      props.matches.map((match) =>
        match[Object.keys(match)[0]].map((match_detail, index) =>
          worksheet.addRow({
            timing: new Date(match_detail.GameTime).toDateString(),
            team: match_detail.TeamName,
            spread: match_detail.Spread,
            spread_bets: match_detail.SpreadBets,
            spread_handled: match_detail.SpreadHandled,
            moneyline: match_detail.Moneyline,
            moneyline_bets: match_detail.MoneylineBets,
            moneyline_handled: match_detail.MoneylineHandled,
            total: match_detail.Total,
            total_bets: match_detail.TotalBets,
            total_handled: match_detail.TotalHandled,
            score: match_detail.Score,
          })
        )
      );

      // loop through all of the rows and set the outline style.
      worksheet.eachRow({ includeEmpty: false }, (row) => {
        // store each cell to currentCell
        const currentCell = row._cells;

        // loop through currentCell to apply border only for the non-empty cell of excel
        currentCell.forEach((singleCell) => {
          // store the cell address i.e. A1, A2, A3, B1, B2, B3, ...
          const cellAddress = singleCell._address;

          // apply border
          worksheet.getCell(cellAddress).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });

      // write the content using writeBuffer
      const buf = await workbook.xlsx.writeBuffer();

      // download the processed file
      saveAs(new Blob([buf]), `${fileName}.xlsx`);
    } catch (error) {
      console.error('<<<ERRROR>>>', error);
      console.error('Something Went Wrong', error.message);
    } finally {
      // removing worksheet's instance to create new one
      workbook.removeWorksheet(workSheetName);
    }
  };

  return (
    <Fragment>
      <div className="d-flex flex-row-reverse">
        <Button
          type="button"
          variant="success"
          className={`mx-2 my-3 ${classes.custom_button}`}
          onClick={saveExcel}
        >
          <FontAwesomeIcon icon={faFileExcel} />
          <span className="mx-1">Export excel</span>
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={() => setModalShow(true)}
          className={`mx-2 my-3 ${classes.custom_button}`}
        >
          <FontAwesomeIcon icon={faFilter} />
          <span className="mx-1">Filter data</span>
        </Button>
      </div>

      <FilterModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        applyFilters={props.applyFilters}
      />

      <div className="table-responsive">
        <Table
          hover
          className={`fs-8 my-5 ${classes.custom_table}`}
          ref={tableRef}
        >
          <thead>
            <tr>
              <th>Timing</th>
              <th>Team</th>
              <th>Spread</th>
              <th>% Bets</th>
              <th>% Handle</th>
              <th>ML</th>
              <th>% Bets</th>
              <th>% Handle</th>
              <th>Total</th>
              <th>% Bets</th>
              <th>% Handle</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {props.matches.map((match) =>
              match[Object.keys(match)[0]].map((match_detail, index) => (
                <tr
                  key={match_detail.MatchId + '_' + index}
                  style={{
                    borderBottom: index === 1 ? '1px solid #757575' : '',
                  }}
                >
                  {index === 0 && (
                    <td
                      className="text-center"
                      rowSpan={2}
                      style={{
                        borderBottom: '1px solid #757575',
                      }}
                    >
                      {new Date(match_detail.GameTime).toDateString()}
                    </td>
                  )}
                  <td className={classes.team_cell}>
                    <div
                      className={classes.team_logo}
                      style={{
                        backgroundSize: 'cover',
                        backgroundImage: `url(${
                          match_detail.TeamLogo
                            ? match_detail.TeamLogo
                            : 'assets/images/blank-placeholder.jpg'
                        })`,
                      }}
                    ></div>
                    <b>{match_detail.TeamName}</b>
                  </td>
                  <td className="text-center fw-bold">{match_detail.Spread}</td>
                  <td className="text-center">{match_detail.SpreadBets}</td>
                  <td className="text-center">{match_detail.SpreadHandled}</td>
                  <td className="text-center fw-bold">
                    {match_detail.Moneyline}
                  </td>
                  <td className="text-center">{match_detail.MoneylineBets}</td>
                  <td className="text-center">
                    {match_detail.MoneylineHandled}
                  </td>
                  <td className="text-center fw-bold">{match_detail.Total}</td>
                  <td className="text-center">{match_detail.TotalBets}</td>
                  <td className="text-center">{match_detail.TotalHandled}</td>
                  <td className="text-center fw-bold">{match_detail.Score}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </Fragment>
  );
}

export default Datatable;